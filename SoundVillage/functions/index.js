const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);
const refUsers = admin.firestore().collection('users');
const refPlaylists = admin.firestore().collection('playlists');


exports.removeSong = functions.firestore.document('/playlists/{playlistId}/queuedSongs/{songId}')
    .onUpdate((change, context) => {

        const score = change.after.data().score;
        let usersJoinedAmount = 0;

        let playlist = refPlaylists.doc(context.params.playlistId).get().then((doc) => {
                console.log("Document data:", doc.data());
                usersJoinedAmount = doc.data().usersJoinedAmount;
                return null;
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
        let x = usersJoinedAmount.toFixed(2);
        console.log("The score is", score);
        console.log("The value is", -(0.20*x));
        if (score.toFixed(2) < -(0.20*x)){
            return refPlaylists.doc(context.params.playlistId).collection('queuedSongs').doc(context.params.songId).delete();
        }
        return "Not removed";
    });
