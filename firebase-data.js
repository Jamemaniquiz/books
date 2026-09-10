// ============================================================
// BookNest shared cloud data layer (Firebase).
// Loaded AFTER firebase-config.js on every page. Replaces the
// old localStorage-only setup so every buyer's device and the
// seller's device see the SAME data.
//
// Load order on every page:
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
//   <script src="firebase-config.js"></script>
//   <script src="firebase-data.js"></script>
// ============================================================

const auth = firebase.auth();
const db   = firebase.firestore();

// ---------- generic cloud key/value store ----------
// Mirrors the old readLocal(key, fallback) / writeLocal(key, value)
// so pages that stored one big array under a key (like ".books")
// can keep almost the same code, just await it and use these
// instead of localStorage.
const DATA_COLLECTION = 'booknest_data';

async function readCloud(key, fallback){
  try{
    const snap = await db.collection(DATA_COLLECTION).doc(key).get();
    if(!snap.exists) return fallback;
    const data = snap.data();
    return ('value' in data) ? data.value : fallback;
  }catch(e){
    console.error('[BookNest] readCloud failed for', key, e);
    return fallback;
  }
}
async function writeCloud(key, value){
  try{
    await db.collection(DATA_COLLECTION).doc(key).set({ value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    return true;
  }catch(e){
    console.error('[BookNest] writeCloud failed for', key, e);
    return false;
  }
}

// ---------- roles ----------
// After any successful login we check whether a matching doc exists
// in `sellers/{uid}`. If it does, they're the seller. Otherwise they're
// a buyer and we expect a matching doc in `buyers/{uid}`.
async function getRole(uid){
  const sellerDoc = await db.collection('sellers').doc(uid).get();
  if(sellerDoc.exists) return 'seller';
  return 'buyer';
}

// ---------- buyer auth ----------
async function buyerSignUp({ name, contact, email, password }){
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection('buyers').doc(cred.user.uid).set({
    name, contact, email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return cred.user;
}
async function buyerLogin(email, password){
  const cred = await auth.signInWithEmailAndPassword(email, password);
  const role = await getRole(cred.user.uid);
  if(role !== 'buyer'){ await auth.signOut(); throw new Error('This is a seller account — use the seller login page.'); }
  return cred.user;
}
async function requestPasswordReset(email){
  // Firebase sends the reset email itself — free, no mail server needed.
  // The buyer's "Forgot password" screen also tells them to message the
  // seller directly in case the email doesn't arrive (spam folder etc.),
  // and the seller can trigger this same function again from the Buyers
  // admin page.
  await auth.sendPasswordResetEmail(email);
}
async function logout(){ await auth.signOut(); }

// ---------- seller auth ----------
// The seller account itself is created once, by hand, in the Firebase
// console (Authentication tab → Add user), then that user's uid is
// added as a document in the `sellers` collection so getRole() above
// recognizes them. See SELLER-SETUP.md.
async function sellerLogin(email, password){
  const cred = await auth.signInWithEmailAndPassword(email, password);
  const role = await getRole(cred.user.uid);
  if(role !== 'seller'){ await auth.signOut(); throw new Error('This account is not a seller account.'); }
  return cred.user;
}

// ---------- current-session helpers ----------
// Call this at the top of a page's script. It resolves once Firebase
// has checked whether someone is already logged in (from a previous
// visit), then calls onReady(user, role) — role is null if signed out.
function whenAuthReady(onReady){
  auth.onAuthStateChanged(async (user)=>{
    if(!user){ onReady(null, null); return; }
    const role = await getRole(user.uid);
    onReady(user, role);
  });
}

// ---------- admin: buyers list + purchase history ----------
async function getAllBuyers(){
  const snap = await db.collection('buyers').orderBy('createdAt','desc').get();
  return snap.docs.map(d=>({ uid:d.id, ...d.data() }));
}
// Orders are stored as one shared array under the ".shop_orders" key
// (via readCloud/writeCloud above) so this just filters that array —
// no separate orders collection to keep in sync.
async function getOrdersForBuyer(buyerUid){
  const orders = await readCloud('.shop_orders', []);
  return orders.filter(o => o.buyerUid === buyerUid);
}
