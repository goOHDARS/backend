import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express = require("express");

const COURSE_COLLECTION = "Courses";
const USER_COLLECTION = "Users";

const app = express();
app.use(express.json());
admin.initializeApp();

app.post("/upload-course", (request, response) => {
  const newCourse = {
    shortName: request.body.shortName,
    fullName: request.body.fullName,
    college: request.body.college,
    credits: request.body.credits,
    description: request.body.description,
    lab: request.body.lab,
    semester: request.body.semester,
    prereq: request.body.prereq,
  };

  admin
    .firestore()
    .collection(COURSE_COLLECTION)
    .add(newCourse)
    .then((res) => {
      response.status(201).send(res.get().then((doc) => doc.data()));
    })
    .catch((err) => {
      response.status(500).send({error: err});
    });
});

app.get("/get-courses", async (request, response) => {
  try {
    const docs = await admin
      .firestore()
      .collection(COURSE_COLLECTION)
      .listDocuments();
    const coursesPromises = docs.map((doc) => doc.get());
    const courses = await Promise.all(coursesPromises);
    response.status(200).send(courses);
  } catch (err) {
    response.status(500).send(err);
  }
});

app.get("/get-user", async (request, response) => {
  try {
    const idToken = request.headers.authorization?.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken ?? "");

    const user = await admin
      .firestore()
      .collection(USER_COLLECTION)
      .doc(decodedToken.uid)
      .get();
    response.status(200).send(user.data());
  } catch (err) {
    response.status(500).send(err);
  }
});

app.post("/set-user", async (request, response) => {
  try {
    const data = request.body;
    const idToken = request.headers.authorization?.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken ?? "");
    console.log(decodedToken);

    const newUser = {
      name: data.name,
      email: data.email,
      password: data.password,
      pid: data.pid,
      major: data.major,
      year: data.year,
      onboarded: true,
    };

    await admin
      .firestore()
      .collection(USER_COLLECTION)
      .doc(decodedToken.uid)
      .set(newUser);
    response.status(201);
  } catch (err) {
    response.status(500).send(err);
  }
});

exports.api = onRequest(app);
