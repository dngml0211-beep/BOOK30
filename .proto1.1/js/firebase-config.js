// Firebase 설정 및 초기화
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyDSKq0BmjLk93kZtgx2-9alTOPJv8UfowM",
  authDomain: "bookclub30-df082.firebaseapp.com",
  projectId: "bookclub30-df082",
  storageBucket: "bookclub30-df082.firebasestorage.app",
  messagingSenderId: "974287877939",
  appId: "1:974287877939:web:69d5472c2c5cd1da367046",
  measurementId: "G-F20BHMDKVJ"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// 익명 로그인
let currentUser = null;
signInAnonymously(auth).then((userCredential) => {
  currentUser = userCredential.user;
  console.log('✅ Firebase 익명 로그인 완료:', currentUser.uid);
}).catch((error) => {
  console.error('❌ Firebase 로그인 실패:', error);
});

// base64 데이터 URL을 Blob으로 변환
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// 녹음 저장 (Firestore + Storage)
export async function saveRecordingToFirebase(bookName, pageNum, recordingData) {
  try {
    console.log('💾 Firebase 저장 시작:', { bookName, pageNum });

    // 1. 오디오 파일을 Storage에 업로드
    const audioBlob = dataURLtoBlob(recordingData.audioData);
    const audioPath = `recordings/${bookName}/page${pageNum}/${recordingData.timestamp}.webm`;
    const audioRef = ref(storage, audioPath);

    await uploadBytes(audioRef, audioBlob);
    const audioURL = await getDownloadURL(audioRef);
    console.log('✅ 오디오 업로드 완료:', audioURL);

    // 2. 메타데이터를 Firestore에 저장
    const docData = {
      bookName,
      pageNum,
      centerX: recordingData.centerX,
      centerY: recordingData.centerY,
      path: recordingData.path,
      audioURL,
      audioPath, // 삭제를 위해 경로 저장
      duration: recordingData.duration,
      createdAt: recordingData.createdAt,
      timestamp: recordingData.timestamp,
      userId: currentUser?.uid || 'anonymous'
    };

    const docRef = await addDoc(collection(db, 'recordings'), docData);
    console.log('✅ Firestore 저장 완료:', docRef.id);

    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('❌ Firebase 저장 실패:', error);
    throw error;
  }
}

// 녹음 로드 (Firestore)
export async function loadRecordingsFromFirebase(bookName) {
  try {
    console.log('📥 Firebase 로드 시작:', bookName);

    const q = query(
      collection(db, 'recordings'),
      where('bookName', '==', bookName)
    );

    const querySnapshot = await getDocs(q);
    const recordings = {};

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const pageNum = data.pageNum;

      if (!recordings[pageNum]) {
        recordings[pageNum] = [];
      }

      recordings[pageNum].push({
        id: docSnapshot.id,
        pageNum: data.pageNum,
        centerX: data.centerX,
        centerY: data.centerY,
        path: data.path,
        audioData: data.audioURL, // URL로 변경
        audioPath: data.audioPath,
        duration: data.duration,
        createdAt: data.createdAt,
        timestamp: data.timestamp
      });
    });

    console.log('✅ Firebase 로드 완료:', Object.keys(recordings).length, '페이지');
    return recordings;
  } catch (error) {
    console.error('❌ Firebase 로드 실패:', error);
    return {};
  }
}

// 녹음 삭제 (Firestore + Storage)
export async function deleteRecordingFromFirebase(recordingId, audioPath) {
  try {
    console.log('🗑️ Firebase 삭제 시작:', recordingId);

    // 1. Storage에서 오디오 파일 삭제
    if (audioPath) {
      const audioRef = ref(storage, audioPath);
      await deleteObject(audioRef);
      console.log('✅ 오디오 삭제 완료');
    }

    // 2. Firestore에서 메타데이터 삭제
    await deleteDoc(doc(db, 'recordings', recordingId));
    console.log('✅ Firestore 삭제 완료');

    return true;
  } catch (error) {
    console.error('❌ Firebase 삭제 실패:', error);
    throw error;
  }
}

// localStorage 폴백 (Firebase 실패 시)
export function saveToLocalStorage(bookName, data) {
  try {
    localStorage.setItem('bc3_recordings_' + bookName, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage 저장 실패:', e);
  }
}

export function loadFromLocalStorage(bookName) {
  try {
    const raw = localStorage.getItem('bc3_recordings_' + bookName);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('localStorage 로드 실패:', e);
    return {};
  }
}
