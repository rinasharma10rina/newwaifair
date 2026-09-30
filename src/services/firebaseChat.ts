import {
  collection,
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  getDocs,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Conversation, NotificationItem } from '../types';

const CHAT_COLLECTION = 'chat_messages';
const CONVERSATIONS_COLLECTION = 'conversations';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * 1. Firestore mein Message Send Karne ka Function (Seller aur Admin dono ke liye)
 * Stored in: chats/{chatId}/messages/{messageId}
 * Top doc updated: chats/{chatId}
 */
export async function sendChatMessage(
  senderId: string,
  receiverId: string,
  messageText: string,
  senderRole: string,
  extra?: {
    imageUrl?: string;
    senderName?: string;
    messageId?: string;
  }
): Promise<string | undefined> {
  if (!db) return undefined;

  const normalizedRole = (senderRole || '').toLowerCase();
  const isSeller = normalizedRole === 'seller';

  // Ek unique chat room ID banayein jo seller ki uid par based ho
  let chatId = isSeller ? senderId : receiverId;
  // If receiver is 'user_admin' or 'admin' and sender is seller, chatId is senderId
  if (!chatId || chatId === 'user_admin' || chatId === 'admin') {
    chatId = isSeller ? senderId : receiverId;
  }

  const messageData: any = {
    senderId: senderId,
    receiverId: receiverId,
    senderRole: isSeller ? 'seller' : 'admin',
    text: messageText || '',
    senderName: extra?.senderName || (isSeller ? 'Seller' : 'Customer Care & Admin'),
    timestamp: serverTimestamp(),
  };

  if (extra?.imageUrl) {
    messageData.imageUrl = extra.imageUrl;
  }

  try {
    // Firestore mein 'chats' collection ke andar specific seller ki thread mein message add karein
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    let msgDocId = extra?.messageId;
    if (msgDocId) {
      await setDoc(doc(messagesCol, msgDocId), messageData, { merge: true });
    } else {
      const addedDoc = await addDoc(messagesCol, messageData);
      msgDocId = addedDoc.id;
    }

    // Last message update karein chat list preview ke liye
    const chatDocRef = doc(db, 'chats', chatId);
    const summaryText = messageText || (extra?.imageUrl ? '📷 Photo' : 'Message');
    await setDoc(
      chatDocRef,
      {
        lastMessage: summaryText,
        lastMessageText: summaryText,
        updatedAt: serverTimestamp(),
        lastMessageTime: new Date().toISOString(),
        sellerId: chatId,
        participantOneId: chatId,
        participantOneName: extra?.senderName || (isSeller ? 'Seller' : undefined),
        participantOneRole: 'SELLER',
        participantTwoId: 'user_admin',
        participantTwoName: 'Customer Care & Admin',
        participantTwoRole: 'ADMIN',
      },
      { merge: true }
    );

    // Also mirror to legacy collection for backward compatibility
    const legacyDocRef = doc(db, CHAT_COLLECTION, msgDocId || `msg_${Date.now()}`);
    await setDoc(
      legacyDocRef,
      {
        id: msgDocId,
        conversationId: chatId,
        senderId,
        senderName: extra?.senderName || (isSeller ? 'Seller' : 'Platform Support'),
        senderRole: isSeller ? 'SELLER' : 'ADMIN',
        text: messageText,
        imageUrl: extra?.imageUrl || null,
        timestamp: new Date().toISOString(),
        isRead: false,
        serverCreatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('[Firestore] Message sent successfully to chats/' + chatId + '/messages:', msgDocId);
    return msgDocId;
  } catch (error) {
    console.error('[Firestore] Error sending message:', error);
    return undefined;
  }
}

/**
 * 2. Real-time Message Listener (Seller Dashboard & Admin Panel dono ke liye)
 * Listens to: chats/{chatId}/messages ordered by timestamp
 */
export function listenToChatMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): () => void {
  if (!db || !chatId) return () => {};

  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let timeString = new Date().toISOString();
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              timeString = data.timestamp.toDate().toISOString();
            } else if (typeof data.timestamp === 'string') {
              timeString = data.timestamp;
            }
          }

          const roleStr = String(data.senderRole || '').toUpperCase();
          const normalizedRole = roleStr === 'SELLER' ? 'SELLER' : 'ADMIN';

          messages.push({
            id: docSnap.id,
            conversationId: chatId,
            senderId: data.senderId || '',
            senderName: data.senderName || (normalizedRole === 'SELLER' ? 'Seller' : 'Customer Care'),
            senderRole: normalizedRole,
            text: data.text || '',
            imageUrl: data.imageUrl || undefined,
            timestamp: timeString,
            isRead: Boolean(data.isRead),
          });
        });
        callback(messages); // UI ko update karne ke liye data pass karein
      },
      (err) => {
        console.warn(`[Firestore] Notice on chats/${chatId}/messages listener:`, err);
      }
    );
  } catch (err) {
    console.warn(`[Firestore] Error setting up listener for chats/${chatId}:`, err);
    return () => {};
  }
}

/**
 * Real-time listener for all chats in `chats` collection (for Admin thread list)
 */
export function listenToAllChats(
  callback: (chats: any[]) => void
): () => void {
  if (!db) return () => {};

  try {
    const chatsCol = collection(db, 'chats');
    return onSnapshot(
      chatsCol,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data,
          });
        });
        callback(list);
      },
      (err) => {
        console.warn('[Firestore] Notice on all chats listener:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Error in listenToAllChats:', err);
    return () => {};
  }
}

/**
 * Saves a chat message to Firestore for real-time multi-device synchronization.
 * Also automatically updates/creates the parent conversation doc.
 */
export async function syncMessageToFirestore(
  message: Message,
  conversationMeta?: Partial<Conversation>
): Promise<void> {
  try {
    if (!db) return;

    // Send through standard sendChatMessage to ensure chats/{chatId}/messages subcollection sync
    const normalizedRole = message.senderRole === 'SELLER' ? 'seller' : 'admin';
    const receiverId =
      message.senderRole === 'SELLER'
        ? conversationMeta?.participantTwoId || 'user_admin'
        : conversationMeta?.participantOneId || message.conversationId;

    await sendChatMessage(
      message.senderId,
      receiverId,
      message.text,
      normalizedRole,
      {
        imageUrl: message.imageUrl,
        senderName: message.senderName,
        messageId: message.id,
      }
    );
  } catch (err) {
    console.warn('Firestore chat sync notice (local message preserved):', err);
  }
}

/**
 * Listens for messages from Firestore across all devices.
 */
export function listenToFirestoreMessages(
  onNewMessage: (msg: Message) => void,
  onDeleteMessage?: (msgId: string) => void
): () => void {
  try {
    if (!db) return () => {};

    const colRef = collection(db, CHAT_COLLECTION);
    const q = query(colRef, limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            const removedId = change.doc.id;
            const dataId = change.doc.data()?.id;
            if (onDeleteMessage) {
              onDeleteMessage(removedId);
              if (dataId && dataId !== removedId) {
                onDeleteMessage(dataId);
              }
            }
          } else if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const msg: Message = {
              id: data.id || change.doc.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderRole: data.senderRole,
              text: data.text || '',
              imageUrl: data.imageUrl || undefined,
              timestamp: data.timestamp || new Date().toISOString(),
              isRead: data.isRead || false,
            };
            onNewMessage(msg);
          }
        });
      },
      (error) => {
        console.warn('Firestore real-time chat listener error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Firestore chat listener:', err);
    return () => {};
  }
}

/**
 * Saves a conversation to Firestore.
 */
export async function syncConversationToFirestore(
  conversation: Conversation
): Promise<void> {
  try {
    if (!db) return;
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversation.id);
    await setDoc(
      convRef,
      {
        ...conversation,
        updatedAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore conversation sync notice:', err);
  }
}

/**
 * Listens for conversations in real-time from Firestore.
 */
export function listenToFirestoreConversations(
  onUpdate: (conversations: Conversation[]) => void
): () => void {
  try {
    if (!db) return () => {};

    const colRef = collection(db, CONVERSATIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const convList: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Conversation;
          convList.push({
            ...data,
            id: docSnap.id,
          });
        });
        if (convList.length > 0) {
          onUpdate(convList);
        }
      },
      (err) => {
        console.warn('Firestore conversations listener notice:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish conversations listener:', err);
    return () => {};
  }
}

/**
 * Saves a notification to Firestore.
 */
export async function syncNotificationToFirestore(
  notification: NotificationItem
): Promise<void> {
  try {
    if (!db) return;
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
    await setDoc(
      notifRef,
      {
        ...notification,
        serverCreatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore notification sync notice:', err);
  }
}

/**
 * Listens for platform notifications in real-time from Firestore.
 */
export function listenToFirestoreNotifications(
  onUpdate: (notifications: NotificationItem[]) => void
): () => void {
  try {
    if (!db) return () => {};

    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const notifList: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as NotificationItem;
          notifList.push({
            ...data,
            id: docSnap.id,
          });
        });
        if (notifList.length > 0) {
          onUpdate(notifList);
        }
      },
      (err) => {
        console.warn('Firestore notifications listener notice:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish notifications listener:', err);
    return () => {};
  }
}

/**
 * Permanently deletes a chat message from Firestore (both subcollection and legacy collection)
 */
export async function deleteChatMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  if (!db) return;
  try {
    const rawId = (chatId || '').trim();
    const cleanId = rawId.startsWith('conv_') ? rawId.replace(/^conv_/, '') : rawId;
    const candidateIds = Array.from(new Set([rawId, cleanId, `conv_${cleanId}`])).filter(Boolean);

    // 1. Delete from chats/{id}/messages/{messageId}
    for (const cId of candidateIds) {
      try {
        const msgDocRef = doc(db, 'chats', cId, 'messages', messageId);
        await deleteDoc(msgDocRef);
      } catch {}

      // Also search by data id field in case doc id was autogenerated
      try {
        const subCol = collection(db, 'chats', cId, 'messages');
        const qSub = query(subCol, where('id', '==', messageId));
        const snapSub = await getDocs(qSub);
        snapSub.forEach((d) => deleteDoc(d.ref));
      } catch {}

      // Check remaining messages to update lastMessage on chat thread doc
      try {
        const remainingQuery = query(
          collection(db, 'chats', cId, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const remainingSnap = await getDocs(remainingQuery);
        const chatDocRef = doc(db, 'chats', cId);
        if (!remainingSnap.empty) {
          const lastData = remainingSnap.docs[0].data();
          const summaryText = lastData.text || (lastData.imageUrl ? '📷 Photo' : 'Message');
          await updateDoc(chatDocRef, {
            lastMessage: summaryText,
            lastMessageText: summaryText,
            lastMessageTime: lastData.timestamp ? new Date().toISOString() : new Date().toISOString(),
          });
        } else {
          await updateDoc(chatDocRef, {
            lastMessage: '',
            lastMessageText: '',
          });
        }
      } catch {}
    }

    // 2. Also delete from legacy chat_messages collection by doc ID or field id
    try {
      const legacyRef = doc(db, CHAT_COLLECTION, messageId);
      await deleteDoc(legacyRef);
    } catch {}

    try {
      const legacyCol = collection(db, CHAT_COLLECTION);
      const qLegacy = query(legacyCol, where('id', '==', messageId));
      const snapLegacy = await getDocs(qLegacy);
      snapLegacy.forEach((d) => deleteDoc(d.ref));
    } catch {}

    console.log(`[Firestore] Deleted chat message ${messageId} from conversation ${chatId}`);
  } catch (err) {
    console.warn('[Firestore] Error deleting chat message:', err);
  }
}

/**
 * Permanently deletes all messages in a conversation and clears thread preview in Firestore
 */
export async function deleteAllChatMessages(chatId: string): Promise<void> {
  if (!db || !chatId) return;
  try {
    const rawId = chatId.trim();
    const cleanId = rawId.startsWith('conv_') ? rawId.replace(/^conv_/, '') : rawId;
    const candidateIds = Array.from(new Set([rawId, cleanId, `conv_${cleanId}`])).filter(Boolean);

    for (const cId of candidateIds) {
      try {
        const messagesCol = collection(db, 'chats', cId, 'messages');
        const snap = await getDocs(messagesCol);
        const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(batchDeletes);

        const chatDocRef = doc(db, 'chats', cId);
        await updateDoc(chatDocRef, {
          lastMessage: '',
          lastMessageText: '',
          unreadAdmin: 0,
          unreadSeller: 0,
          unreadCountParticipantOne: 0,
          unreadCountParticipantTwo: 0,
          updatedAt: serverTimestamp(),
        });
      } catch {}

      try {
        const legacyCol = collection(db, CHAT_COLLECTION);
        const qLegacy = query(legacyCol, where('conversationId', '==', cId));
        const snapLegacy = await getDocs(qLegacy);
        const legDeletes = snapLegacy.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(legDeletes);
      } catch {}
    }
    console.log(`[Firestore] Cleared all chat messages for ${chatId}`);
  } catch (err) {
    console.warn('[Firestore] Error clearing chat messages:', err);
  }
}

/**
 * Marks messages in a conversation as read in Firestore
 */
export async function markChatMessagesAsRead(
  chatId: string,
  readerRole: 'ADMIN' | 'SELLER'
): Promise<void> {
  if (!db || !chatId) return;

  try {
    const otherRoleLower = readerRole === 'ADMIN' ? 'seller' : 'admin';
    const otherRoleUpper = readerRole === 'ADMIN' ? 'SELLER' : 'ADMIN';

    const rawId = chatId.trim();
    const cleanId = rawId.startsWith('conv_') ? rawId.replace(/^conv_/, '') : rawId;
    const candidateIds = Array.from(new Set([rawId, cleanId, `conv_${cleanId}`])).filter(Boolean);

    const updates: Promise<any>[] = [];

    for (const cId of candidateIds) {
      // 1. Update unread messages in chats/{cId}/messages
      try {
        const messagesCol = collection(db, 'chats', cId, 'messages');
        const snap = await getDocs(messagesCol);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const sRole = String(data.senderRole || '').toLowerCase();
          const isFromOther =
            sRole === otherRoleLower ||
            sRole === otherRoleUpper.toLowerCase() ||
            (readerRole === 'SELLER' && (data.senderRole === 'ADMIN' || data.senderId === 'user_admin' || sRole !== 'seller')) ||
            (readerRole === 'ADMIN' && (data.senderRole === 'SELLER' || sRole === 'seller' || data.senderId !== 'user_admin'));

          if (isFromOther && !data.isRead) {
            updates.push(updateDoc(docSnap.ref, { isRead: true }));
          }
        });
      } catch {}

      // 2. Update legacy collection
      try {
        const legacyCol = collection(db, CHAT_COLLECTION);
        const legacyQ = query(
          legacyCol,
          where('conversationId', '==', cId),
          where('isRead', '==', false)
        );
        const legacySnap = await getDocs(legacyQ);
        legacySnap.forEach((docSnap) => {
          const data = docSnap.data();
          const sRole = String(data.senderRole || '').toUpperCase();
          if (sRole === otherRoleUpper || (readerRole === 'SELLER' && sRole !== 'SELLER') || (readerRole === 'ADMIN' && sRole !== 'ADMIN')) {
            updates.push(updateDoc(docSnap.ref, { isRead: true }));
          }
        });
      } catch {}

      // 3. Clear unread counts on the conversation document itself
      try {
        const chatDocRef = doc(db, 'chats', cId);
        if (readerRole === 'ADMIN') {
          updates.push(updateDoc(chatDocRef, { unreadAdmin: 0, unreadCountParticipantTwo: 0 }).catch(() => {}));
        } else {
          updates.push(updateDoc(chatDocRef, { unreadSeller: 0, unreadCountParticipantOne: 0 }).catch(() => {}));
        }
      } catch {}
    }

    await Promise.all(updates);
    console.log(`[Firestore] Marked ${updates.length} messages as read in chat ${chatId} for reader ${readerRole}`);
  } catch (err) {
    console.warn('[Firestore] Notice marking messages as read:', err);
  }
}

/**
 * Permanently deletes an entire conversation, its document, and all messages in sub-collections from Firestore.
 */
export async function deleteEntireConversationFromFirestore(conversationId: string): Promise<void> {
  if (!conversationId) return;

  const rawId = conversationId.trim();
  const cleanId = rawId.startsWith('conv_') ? rawId.replace(/^conv_/, '') : rawId;
  const candidateIds = Array.from(new Set([rawId, cleanId, `conv_${cleanId}`])).filter(Boolean);

  // 1. Clean localStorage
  try {
    const rawConv = localStorage.getItem('nexus_conversations');
    if (rawConv) {
      const convs: Conversation[] = JSON.parse(rawConv);
      const filtered = convs.filter((c) => !candidateIds.includes(c.id));
      localStorage.setItem('nexus_conversations', JSON.stringify(filtered));
    }
    const rawMsg = localStorage.getItem('nexus_messages');
    if (rawMsg) {
      const msgs: Message[] = JSON.parse(rawMsg);
      const filtered = msgs.filter((m) => !candidateIds.includes(m.conversationId));
      localStorage.setItem('nexus_messages', JSON.stringify(filtered));
    }
  } catch {}

  // 2. Broadcast across tabs
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexus_chat_channel');
      bc.postMessage({ type: 'CONVERSATION_DELETED', conversationId });
      setTimeout(() => bc.close(), 1000);
    }
  } catch {}

  if (!db) return;

  try {
    for (const cId of candidateIds) {
      // 1. Delete all message docs in /chats/{cId}/messages subcollection
      try {
        const messagesCol = collection(db, 'chats', cId, 'messages');
        const snap = await getDocs(messagesCol);
        const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(batchDeletes);
      } catch {}

      // 2. Delete /chats/{cId} parent document
      try {
        await deleteDoc(doc(db, 'chats', cId));
      } catch {}

      // 3. Delete /conversations/{cId} document if present
      try {
        await deleteDoc(doc(db, CONVERSATIONS_COLLECTION, cId));
      } catch {}

      // 4. Delete legacy /chat_messages
      try {
        const legacyCol = collection(db, CHAT_COLLECTION);
        const qLegacy = query(legacyCol, where('conversationId', '==', cId));
        const snapLegacy = await getDocs(qLegacy);
        const legDeletes = snapLegacy.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(legDeletes);
      } catch {}
    }

    console.log(`[Firestore] Conversation ${conversationId} and all message subcollections permanently deleted from backend database.`);
  } catch (err) {
    console.warn('[Firestore] Error deleting entire conversation from Firestore:', err);
  }
}

/**
 * Permanently deletes all conversations, chats, and messages involving a seller from Firestore
 */
export async function deleteAllChatsForSellerFromFirestore(sellerId: string, email?: string): Promise<void> {
  if (!sellerId && !email) return;
  if (!db) return;

  try {
    const candidateChatIds = new Set<string>();
    if (sellerId) {
      candidateChatIds.add(sellerId);
      candidateChatIds.add(`conv_${sellerId}`);
      if (sellerId.startsWith('conv_')) {
        candidateChatIds.add(sellerId.replace(/^conv_/, ''));
      }
    }

    // Query chats collection
    try {
      const chatsCol = collection(db, 'chats');
      const allChatsSnap = await getDocs(chatsCol);
      allChatsSnap.forEach((d) => {
        const data = d.data();
        const matchesSeller =
          (sellerId && (data.sellerId === sellerId || data.userId === sellerId)) ||
          (email && data.sellerEmail && data.sellerEmail.toLowerCase() === email.toLowerCase()) ||
          (Array.isArray(data.participantIds) && sellerId && data.participantIds.includes(sellerId));
        if (matchesSeller) {
          candidateChatIds.add(d.id);
        }
      });
    } catch {}

    // Query conversations collection
    try {
      const convsCol = collection(db, CONVERSATIONS_COLLECTION);
      const allConvsSnap = await getDocs(convsCol);
      allConvsSnap.forEach((d) => {
        const data = d.data();
        const matchesSeller =
          (sellerId && (data.sellerId === sellerId || data.userId === sellerId)) ||
          (Array.isArray(data.participantIds) && sellerId && data.participantIds.includes(sellerId));
        if (matchesSeller) {
          candidateChatIds.add(d.id);
        }
      });
    } catch {}

    // Wipe each conversation found
    for (const chatId of Array.from(candidateChatIds)) {
      await deleteEntireConversationFromFirestore(chatId);
    }

    // Also wipe any standalone messages sent by this seller
    if (sellerId) {
      try {
        const msgCol = collection(db, CHAT_COLLECTION);
        const qSender = query(msgCol, where('senderId', '==', sellerId));
        const snapSender = await getDocs(qSender);
        const deleteSenderMsgs = snapSender.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deleteSenderMsgs);
      } catch {}
    }

    console.log(`[Firestore] Wiped all chat records and conversations for seller ${sellerId || email}`);
  } catch (err) {
    console.warn('[Firestore] Error wiping chats for seller:', err);
  }
}
