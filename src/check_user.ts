import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

async function checkUser() {
    try {
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        
        console.log("Users in Firestore:");
        userSnapshot.forEach((doc) => {
            console.log(`ID: ${doc.id}, Data:`, doc.data());
        });

        const targetEmail = 'qariarif07@gmail.com';
        const userDoc = await getDoc(doc(db, 'users', targetEmail));
        
        if (userDoc.exists()) {
            console.log(`\nFound user ${targetEmail}:`, userDoc.data());
        } else {
            console.log(`\nUser ${targetEmail} not found.`);
        }
    } catch (error) {
        console.error('Error checking user:', error);
    }
}

checkUser();
