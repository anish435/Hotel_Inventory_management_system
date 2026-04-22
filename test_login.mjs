import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCmylEhv5JmoLvsG5-_A4z2_itOTO44QY",
  authDomain: "vasihnavi-inn-db.firebaseapp.com",
  projectId: "vasihnavi-inn-db",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
    try {
        await signInWithEmailAndPassword(auth, "vaishnaviinnrjy@gmail.com", "Vaishnavi@1212");
        console.log("SUCCESS: Logged in!");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}
run();
