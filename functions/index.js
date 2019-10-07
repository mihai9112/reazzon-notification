const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.sendNotification = functions.firestore
  .document("chats/{groupId1}/{groupId2}/{message}")
  .onCreate((snap, context) => {
    console.log(
      "----------------start function-------------------- " +
        context.params.groupId1
    );

    const doc = snap.data();
    console.log(doc);

    const idFrom = doc.from;
    const idTo = doc.to;
    const contentMessage = doc.content;

    // -------- Store Notification --------------

    var id = Date.now();

    var data;

    admin
      .firestore()
      .collection("Users")
      .where("userId", "==", idFrom)
      .get()
      .then(querySnapshot2 => {
        querySnapshot2.forEach(userFrom => {
          if (userFrom.data().imageURL != null) {
            data = {
              fromId: idFrom,
              from: userFrom.data().userName,
              imageURL: userFrom.data().imageURL,
              content: contentMessage,
              at: id
            };
          } else {
            data = {
              fromId: idFrom,
              from: userFrom.data().userName,
              content: contentMessage,
              imageURL:
                "https://rukminim1.flixcart.com/image/352/352/poster/m/j/f/cute-new-born-baby-non-tearable-synthetic-sheet-poster-pb008-original-imae7qvrnsygcwg6.jpeg",
              at: id
            };
          }

          db.collection("notifications")
            .doc(idTo)
            .collection(idTo)
            .doc(id.toString())
            .set(data);
        });
      });

    //// --- store notitfication ---

    // Get push token user to (receive)
    admin
      .firestore()
      .collection("Users")
      .where("userId", "==", idTo)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(userTo => {
          console.log(
            `Found user to: ${userTo.data().userName}, ${
              userTo.data().pushToken
            }, ${userTo.data().chattingWith},`
          );

          if (
            userTo.data().pushToken &&
            userTo.data().chattingWith !== idFrom
          ) {
            // Get info user from (sent)
            admin
              .firestore()
              .collection("Users")
              .where("userId", "==", idFrom)
              .get()
              .then(querySnapshot2 => {
                querySnapshot2.forEach(userFrom => {
                  console.log(`Found user from: ${userFrom.data().userName}`);
                  const payload = {
                    notification: {
                      title: `You have a message from "${
                        userFrom.data().userName
                      }"`,
                      body: contentMessage,
                      badge: "1",
                      sound: "default"
                    }
                  };
                  // Let push to the target device
                  admin
                    .messaging()
                    .sendToDevice(userTo.data().pushToken, payload)
                    .then(response => {
                      console.log("Successfully sent message:", response);
                    })
                    .catch(error => {
                      console.log("Error sending message:", error);
                    });
                });
              });
          } else {
            console.log("Can not find pushToken target user");
          }
        });
      });
    return null;
  });
