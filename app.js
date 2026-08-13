import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


/* =====================================
   Firebase
===================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =====================================
   短縮関数
===================================== */

const $ = (id) => {
  return document.getElementById(id);
};


/* =====================================
   アプリ内の状態
===================================== */

const state = {

  user: null,

  profile: null,

  classId: null,

  classData: null,

  assignments: [],

  timetable: {},

  events: [],

  lessonDate: "",

  unsubscribers: []

};


/* =====================================
   教科
===================================== */

const categories = [

  "国語",

  "社会",

  "数学",

  "理科",

  "英語",

  "技術・家庭",

  "音楽",

  "美術",

  "保健体育",

  "道徳",

  "総合",

  "学活",

  "重要",

  "その他"

];


/* =====================================
   曜日
===================================== */

const days = [

  ["mon", "月"],

  ["tue", "火"],

  ["wed", "水"],

  ["thu", "木"],

  ["fri", "金"]

];


/* =====================================
   メッセージ表示
===================================== */

function showToast(message) {

  const toast = $("toast");

  toast.textContent = message;

  toast.hidden = false;

  clearTimeout(showToast.timer);


  showToast.timer = setTimeout(() => {

    toast.hidden = true;

  }, 3200);

}


/* =====================================
   エラーメッセージ
===================================== */

function friendlyError(error) {

  console.error(error);

  const code = error?.code || "";


  if (code.includes("invalid-credential")) {

    return "メールアドレスまたはパスワードを確認してください。";

  }


  if (code.includes("email-already-in-use")) {

    return "このメールアドレスはすでに登録されています。";

  }


  if (code.includes("weak-password")) {

    return "パスワードは6文字以上にしてください。";

  }


  if (code.includes("permission-denied")) {

    return "この操作を行う権限がありません。";

  }


  return error?.message || "エラーが発生しました。";

}


/* =====================================
   画面を全部隠す
===================================== */

function hideAllViews() {

  document
    .querySelectorAll(".view")
    .forEach((view) => {

      view.hidden = true;

    });

}


/* =====================================
   上部タイトル
===================================== */

function setHeader(

  title,

  {
    back = false,
    account = true
  } = {}

) {

  $("pageTitle").textContent = title;

  $("backButton").hidden = !back;

  $("accountButton").hidden =
    !account || !state.user;


  if (state.classData) {

    $("classLabel").textContent =
      `${state.classData.schoolName} / ` +
      `${state.classData.gradeName} ` +
      `${state.classData.className}`;

  } else {

    $("classLabel").textContent = "";

  }

}


/* =====================================
   画面切替
===================================== */

function openView(id) {

  hideAllViews();

  $(id).hidden = false;


  if (id === "authView") {

    setHeader(
      "クラス共有ノート",
      {
        account: false
      }
    );

  }


  if (id === "classView") {

    setHeader(
      "クラス選択",
      {
        account: true
      }
    );

  }


  if (id === "homeView") {

    setHeader(
      "選択画面",
      {
        account: true
      }
    );

  }


  if (id === "assignmentsView") {

    setHeader(
      "提出物",
      {
        back: true,
        account: true
      }
    );

  }


  if (id === "timetableView") {

    setHeader(
      "時間割",
      {
        back: true,
        account: true
      }
    );

  }


  if (id === "lessonView") {

    setHeader(
      "授業内容連絡",
      {
        back: true,
        account: true
      }
    );

  }


  if (id === "accountView") {

    setHeader(
      "アカウント",
      {
        back: true,
        account: false
      }
    );

  }

}


/* =====================================
   リアルタイム通信停止
===================================== */

function stopRealtimeListeners() {

  state.unsubscribers.forEach(

    (unsubscribe) => {

      unsubscribe();

    }

  );


  state.unsubscribers = [];

}


/* =====================================
   クラスコード作成
===================================== */

function randomClassCode() {

  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  const bytes =
    new Uint8Array(12);


  crypto.getRandomValues(bytes);


  return Array
    .from(
      bytes,
      (b) =>
        alphabet[
          b % alphabet.length
        ]
    )
    .join("");

}


/* =====================================
   ユーザー情報取得
===================================== */

async function loadProfile(uid) {

  const snap =
    await getDoc(
      doc(
        db,
        "users",
        uid
      )
    );


  state.profile =
    snap.exists()
      ? snap.data()
      : null;


  return state.profile;

}


/* =====================================
   参加クラス一覧
===================================== */

async function renderMyClasses() {

  const list =
    $("myClassList");


  list.innerHTML = "";


  if (!state.user) {

    return;

  }


  const memberships =
    await getDocs(

      collection(

        db,

        "users",

        state.user.uid,

        "classes"

      )

    );


  if (memberships.empty) {

    list.innerHTML =
      '<p class="empty">' +
      'まだ参加しているクラスはありません。' +
      '</p>';

    return;

  }


  for (
    const memberDoc
    of memberships.docs
  ) {

    const classId =
      memberDoc.id;


    try {

      const classSnap =
        await getDoc(

          doc(
            db,
            "classes",
            classId
          )

        );


      if (!classSnap.exists()) {

        continue;

      }


      const data =
        classSnap.data();


      const item =
        document.createElement("div");


      item.className =
        "list-item";


      item.innerHTML = `

        <div class="list-item-row">

          <div>

            <strong>
              ${escapeHtml(data.schoolName)}
            </strong>

            <div>
              ${escapeHtml(data.gradeName)}
              ${escapeHtml(data.className)}
            </div>

            <div class="meta">
              コード:
              ${classId}
            </div>

          </div>

          <button class="primary">
            開く
          </button>

        </div>

      `;


      item
        .querySelector("button")
        .addEventListener(
          "click",
          () => {

            selectClass(classId);

          }
        );


      list.appendChild(item);

    } catch (error) {

      console.error(error);

    }

  }

}


/* =====================================
   クラスを開く
===================================== */

async function selectClass(classId) {

  const memberSnap =
    await getDoc(

      doc(

        db,

        "classes",

        classId,

        "members",

        state.user.uid

      )

    );


  if (!memberSnap.exists()) {

    throw new Error(
      "このクラスのメンバーではありません。"
    );

  }


  const classSnap =
    await getDoc(

      doc(
        db,
        "classes",
        classId
      )

    );


  if (!classSnap.exists()) {

    throw new Error(
      "クラスが見つかりません。"
    );

  }


  state.classId =
    classId;


  state.classData =
    classSnap.data();


  $("currentClassCode").textContent =
    classId;


  startRealtimeListeners();


  openView("homeView");

}


/* =====================================
   クラス作成
===================================== */

async function createClass() {

  if (
    state.profile?.role
    !== "teacher"
  ) {

    showToast(
      "クラス作成は先生登録のアカウントだけです。"
    );

    return;

  }


  const schoolName =
    $("schoolName")
      .value
      .trim();


  const gradeName =
    $("gradeName")
      .value
      .trim();


  const className =
    $("className")
      .value
      .trim();


  if (
    !schoolName ||
    !gradeName ||
    !className
  ) {

    showToast(
      "学校名・学年・クラス名を入力してください。"
    );

    return;

  }


  try {

    let classId;


    for (
      let i = 0;
      i < 5;
      i++
    ) {

      const candidate =
        randomClassCode();


      const candidateSnap =
        await getDoc(

          doc(
            db,
            "classes",
            candidate
          )

        );


      if (!candidateSnap.exists()) {

        classId =
          candidate;

        break;

      }

    }


    if (!classId) {

      throw new Error(
        "クラスコードを作れませんでした。"
      );

    }


    await setDoc(

      doc(
        db,
        "classes",
        classId
      ),

      {

        schoolName,

        gradeName,

        className,

        createdBy:
          state.user.uid,

        createdAt:
          serverTimestamp()

      }

    );


    await setDoc(

      doc(

        db,

        "classes",

        classId,

        "members",

        state.user.uid

      ),

      {

        displayName:
          state.profile.displayName,

        role:
          state.profile.role,

        joinedAt:
          serverTimestamp()

      }

    );


    await setDoc(

      doc(

        db,

        "users",

        state.user.uid,

        "classes",

        classId

      ),

      {

        joinedAt:
          serverTimestamp()

      }

    );


    showToast(
      `クラスを作成しました。コード: ${classId}`
    );


    await renderMyClasses();


    await selectClass(
      classId
    );

  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   クラス参加
===================================== */

async function joinClass() {

  const classId =
    $("joinClassCode")
      .value
      .trim()
      .toUpperCase();


  if (!classId) {

    showToast(
      "クラスコードを入力してください。"
    );

    return;

  }


  try {

    const classSnap =
      await getDoc(

        doc(
          db,
          "classes",
          classId
        )

      );


    if (!classSnap.exists()) {

      showToast(
        "クラスが見つかりません。"
      );

      return;

    }


    await setDoc(

      doc(

        db,

        "classes",

        classId,

        "members",

        state.user.uid

      ),

      {

        displayName:
          state.profile.displayName,

        role:
          state.profile.role,

        joinedAt:
          serverTimestamp()

      }

    );


    await setDoc(

      doc(

        db,

        "users",

        state.user.uid,

        "classes",

        classId

      ),

      {

        joinedAt:
          serverTimestamp()

      }

    );


    showToast(
      "クラスに参加しました。"
    );


    await renderMyClasses();


    await selectClass(
      classId
    );

  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   Firebaseリアルタイム更新
===================================== */

function startRealtimeListeners() {

  stopRealtimeListeners();


  if (!state.classId) {

    return;

  }


  /* 提出物 */

  const assignmentsUnsub =
    onSnapshot(

      collection(

        db,

        "classes",

        state.classId,

        "assignments"

      ),

      (snap) => {

        state.assignments =
          snap.docs.map(

            (d) => ({

              id: d.id,

              ...d.data()

            })

          );


        renderAssignments();

      },

      (error) => {

        showToast(
          friendlyError(error)
        );

      }

    );


  /* 時間割 */

  const timetableUnsub =
    onSnapshot(

      collection(

        db,

        "classes",

        state.classId,

        "timetable"

      ),

      (snap) => {

        state.timetable = {};


        snap.docs.forEach(

          (d) => {

            state.timetable[d.id] = {

              id: d.id,

              ...d.data()

            };

          }

        );


        renderTimetable();

      },

      (error) => {

        showToast(
          friendlyError(error)
        );

      }

    );


  /* 行事 */

  const eventsUnsub =
    onSnapshot(

      collection(

        db,

        "classes",

        state.classId,

        "events"

      ),

      (snap) => {

        state.events =
          snap.docs.map(

            (d) => ({

              id: d.id,

              ...d.data()

            })

          );


        renderEvents();

      },

      (error) => {

        showToast(
          friendlyError(error)
        );

      }

    );


  state.unsubscribers.push(

    assignmentsUnsub,

    timetableUnsub,

    eventsUnsub

  );

}


/* =====================================
   提出物表示
===================================== */

function renderAssignments() {

  const wrapper =
    $("assignmentGroups");


  wrapper.innerHTML = "";


  for (
    const category
    of categories
  ) {

    const items =
      state.assignments

        .filter(

          (item) =>
            item.category
            === category

        )

        .sort(

          (a, b) =>
            (
              a.dueDate
              || "9999"
            )
              .localeCompare(
                b.dueDate
                || "9999"
              )

        );


    const section =
      document.createElement(
        "section"
      );


    section.className =
      "assignment-group";


    section.innerHTML =
      `<h2 class="assignment-heading">
        ${escapeHtml(category)}
      </h2>`;


    if (
      items.length === 0
    ) {

      section.insertAdjacentHTML(

        "beforeend",

        '<p class="empty">' +
        '現在ありません。' +
        '</p>'

      );

    } else {


      for (
        const item
        of items
      ) {


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "assignment-card";


        card.innerHTML = `

          <h3>
            ${escapeHtml(
              item.title || ""
            )}
          </h3>


          ${
            item.detail
              ?
              `<p>
                ${nl2br(
                  item.detail
                )}
              </p>`
              :
              ""
          }


          <div class="meta">

            ${
              item.dueDate
                ?
                `期限:
                ${escapeHtml(
                  item.dueDate
                )}
                <br>`
                :
                ""
            }


            ${
              item.status
                ?
                `状況:
                ${escapeHtml(
                  item.status
                )}
                <br>`
                :
                ""
            }


            ${
              item.updatedByName
                ?
                `最終更新:
                ${escapeHtml(
                  item.updatedByName
                )}`
                :
                ""
            }

          </div>


          <div class="actions">

            <button data-action="edit">
              編集
            </button>

            <button
              data-action="delete"
              class="danger"
            >
              削除
            </button>

          </div>

        `;


        card
          .querySelector(
            '[data-action="edit"]'
          )
          .addEventListener(

            "click",

            () => {

              openAssignmentDialog(
                item
              );

            }

          );


        card
          .querySelector(
            '[data-action="delete"]'
          )
          .addEventListener(

            "click",

            () => {

              deleteAssignment(
                item
              );

            }

          );


        section.appendChild(
          card
        );

      }

    }


    wrapper.appendChild(
      section
    );

  }

}


/* =====================================
   提出物入力画面
===================================== */

function openAssignmentDialog(
  item = null
) {

  $("assignmentDialogTitle")
    .textContent =
      item
        ? "提出物を編集"
        : "提出物を追加";


  $("assignmentId").value =
    item?.id || "";


  $("assignmentCategory").value =
    item?.category || "国語";


  $("assignmentTitle").value =
    item?.title || "";


  $("assignmentDetail").value =
    item?.detail || "";


  $("assignmentDueDate").value =
    item?.dueDate || "";


  $("assignmentStatus").value =
    item?.status || "";


  $("assignmentDialog")
    .showModal();

}


/* =====================================
   提出物保存
===================================== */

async function saveAssignment() {

  const id =
    $("assignmentId").value;


  const title =
    $("assignmentTitle")
      .value
      .trim();


  if (!title) {

    showToast(
      "タイトルを入力してください。"
    );

    return;

  }


  const data = {

    category:
      $("assignmentCategory").value,

    title,

    detail:
      $("assignmentDetail")
        .value
        .trim(),

    dueDate:
      $("assignmentDueDate").value,

    status:
      $("assignmentStatus")
        .value
        .trim(),

    updatedBy:
      state.user.uid,

    updatedByName:
      state.profile.displayName,

    updatedAt:
      serverTimestamp()

  };


  try {


    if (id) {

      await updateDoc(

        doc(

          db,

          "classes",

          state.classId,

          "assignments",

          id

        ),

        data

      );

    } else {


      await addDoc(

        collection(

          db,

          "classes",

          state.classId,

          "assignments"

        ),

        {

          ...data,

          createdBy:
            state.user.uid,

          createdByName:
            state.profile.displayName,

          createdAt:
            serverTimestamp()

        }

      );

    }


    $("assignmentDialog")
      .close();


    showToast(
      "保存しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   提出物削除
===================================== */

async function deleteAssignment(
  item
) {

  const ok =
    confirm(

      `「${item.title}」を削除しますか？\n` +
      "この変更はクラス全員に反映されます。"

    );


  if (!ok) {

    return;

  }


  try {

    await deleteDoc(

      doc(

        db,

        "classes",

        state.classId,

        "assignments",

        item.id

      )

    );


    showToast(
      "削除しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   時間割表示
===================================== */

function renderTimetable() {

  const body =
    $("timetableBody");


  body.innerHTML = "";


  for (
    let period = 1;
    period <= 6;
    period++
  ) {


    const tr =
      document.createElement(
        "tr"
      );


    const th =
      document.createElement(
        "th"
      );


    th.textContent =
      `${period}限`;


    tr.appendChild(
      th
    );


    for (
      const [
        dayKey,
        dayLabel
      ]
      of days
    ) {


      const cellId =
        `${dayKey}-${period}`;


      const item =
        state.timetable[cellId]
        || {};


      const td =
        document.createElement(
          "td"
        );


      const button =
        document.createElement(
          "button"
        );


      button.className =
        "cell-button";


      button.innerHTML = `

        <strong>

          ${escapeHtml(
            item.subject || "＋"
          )}

        </strong>


        ${
          item.memo
            ?
            `<span>
              ${escapeHtml(
                item.memo
              )}
            </span>`
            :
            ""
        }

      `;


      button.addEventListener(

        "click",

        () => {

          openCellDialog(

            cellId,

            dayLabel,

            period,

            item

          );

        }

      );


      td.appendChild(
        button
      );


      tr.appendChild(
        td
      );

    }


    body.appendChild(
      tr
    );

  }

}


/* =====================================
   時間割編集
===================================== */

function openCellDialog(

  cellId,

  dayLabel,

  period,

  item

) {

  $("cellDialogTitle")
    .textContent =
      `${dayLabel}曜日 ${period}限`;


  $("cellId").value =
    cellId;


  $("cellSubject").value =
    item.subject || "";


  $("cellMemo").value =
    item.memo || "";


  $("cellDialog")
    .showModal();

}


/* =====================================
   時間割保存
===================================== */

async function saveCell() {

  const cellId =
    $("cellId").value;


  const subject =
    $("cellSubject")
      .value
      .trim();


  const memo =
    $("cellMemo")
      .value
      .trim();


  try {

    await setDoc(

      doc(

        db,

        "classes",

        state.classId,

        "timetable",

        cellId

      ),

      {

        subject,

        memo,

        updatedBy:
          state.user.uid,

        updatedByName:
          state.profile.displayName,

        updatedAt:
          serverTimestamp()

      },

      {
        merge: true
      }

    );


    $("cellDialog")
      .close();


    showToast(
      "時間割を保存しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   時間割削除
===================================== */

async function deleteCell() {

  const cellId =
    $("cellId").value;


  if (
    !confirm(
      "この時間割の内容を削除しますか？"
    )
  ) {

    return;

  }


  try {

    await deleteDoc(

      doc(

        db,

        "classes",

        state.classId,

        "timetable",

        cellId

      )

    );


    $("cellDialog")
      .close();


    showToast(
      "削除しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   行事一覧
===================================== */

function renderEvents() {

  const list =
    $("eventList");


  list.innerHTML = "";


  const events =
    [...state.events]
      .sort(

        (a, b) =>
          (
            a.date
            || "9999"
          )
            .localeCompare(
              b.date
              || "9999"
            )

      );


  if (
    events.length === 0
  ) {

    list.innerHTML =
      '<p class="empty">' +
      '現在ありません。' +
      '</p>';

    return;

  }


  for (
    const item
    of events
  ) {


    const row =
      document.createElement(
        "div"
      );


    row.className =
      "list-item";


    row.innerHTML = `

      <div class="list-item-row">

        <div>

          <strong>
            ${escapeHtml(
              item.type || "連絡"
            )}
          </strong>


          <div>
            ${nl2br(
              item.text || ""
            )}
          </div>


          <div class="meta">

            ${
              item.date
                ?
                `日付:
                ${escapeHtml(
                  item.date
                )}
                / `
                :
                ""
            }


            ${
              item.updatedByName
                ?
                `最終更新:
                ${escapeHtml(
                  item.updatedByName
                )}`
                :
                ""
            }

          </div>

        </div>


        <div class="actions">

          <button data-action="edit">
            編集
          </button>


          <button
            data-action="delete"
            class="danger"
          >
            削除
          </button>

        </div>

      </div>

    `;


    row
      .querySelector(
        '[data-action="edit"]'
      )
      .addEventListener(

        "click",

        () => {

          openEventDialog(
            item
          );

        }

      );


    row
      .querySelector(
        '[data-action="delete"]'
      )
      .addEventListener(

        "click",

        () => {

          deleteEvent(
            item
          );

        }

      );


    list.appendChild(
      row
    );

  }

}


/* =====================================
   行事入力
===================================== */

function openEventDialog(
  item = null
) {

  $("eventDialogTitle")
    .textContent =
      item
        ? "行事・連絡を編集"
        : "行事・連絡を追加";


  $("eventId").value =
    item?.id || "";


  $("eventDate").value =
    item?.date || "";


  $("eventType").value =
    item?.type || "行事";


  $("eventText").value =
    item?.text || "";


  $("eventDialog")
    .showModal();

}


/* =====================================
   行事保存
===================================== */

async function saveEvent() {

  const id =
    $("eventId").value;


  const text =
    $("eventText")
      .value
      .trim();


  if (!text) {

    showToast(
      "内容を入力してください。"
    );

    return;

  }


  const data = {

    date:
      $("eventDate").value,

    type:
      $("eventType").value,

    text,

    updatedBy:
      state.user.uid,

    updatedByName:
      state.profile.displayName,

    updatedAt:
      serverTimestamp()

  };


  try {


    if (id) {

      await updateDoc(

        doc(

          db,

          "classes",

          state.classId,

          "events",

          id

        ),

        data

      );

    } else {

      await addDoc(

        collection(

          db,

          "classes",

          state.classId,

          "events"

        ),

        {

          ...data,

          createdBy:
            state.user.uid,

          createdByName:
            state.profile.displayName,

          createdAt:
            serverTimestamp()

        }

      );

    }


    $("eventDialog")
      .close();


    showToast(
      "保存しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   行事削除
===================================== */

async function deleteEvent(item) {

  if (

    !confirm(

      "この行事・連絡事項を削除しますか？\n" +

      "この変更はクラス全員に反映されます。"

    )

  ) {

    return;

  }


  try {

    await deleteDoc(

      doc(

        db,

        "classes",

        state.classId,

        "events",

        item.id

      )

    );


    showToast(
      "削除しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   授業内容の6時間分を作成
===================================== */

function buildLessonPeriods() {

  const wrapper =
    $("lessonPeriods");


  wrapper.innerHTML = "";


  for (
    let period = 1;
    period <= 6;
    period++
  ) {


    const section =
      document.createElement(
        "section"
      );


    section.className =
      "lesson-period";


    section.innerHTML = `

      <h3>
        ${period}限
      </h3>


      <div class="lesson-period-grid">

        <label>

          科目

          <input

            id="lessonSubject${period}"

            type="text"

            maxlength="40"

          />

        </label>


        <label>

          学習したこと

          <textarea

            id="lessonText${period}"

            rows="3"

            maxlength="500"

          ></textarea>

        </label>

      </div>

    `;


    wrapper.appendChild(
      section
    );

  }

}


/* =====================================
   授業内容を空にする
===================================== */

function clearLessonForm() {

  $("lessonWriter").value =
    "";


  $("everyoneNote").value =
    "";


  $("teacherNote").value =
    "";


  for (
    let i = 1;
    i <= 6;
    i++
  ) {

    $(`lessonSubject${i}`)
      .value = "";


    $(`lessonText${i}`)
      .value = "";

  }

}


/* =====================================
   授業内容読み込み
===================================== */

async function loadLesson() {

  const date =
    $("lessonDate").value;


  if (
    !date ||
    !state.classId
  ) {

    return;

  }


  state.lessonDate =
    date;


  try {

    const snap =
      await getDoc(

        doc(

          db,

          "classes",

          state.classId,

          "lessonReports",

          date

        )

      );


    clearLessonForm();


    if (!snap.exists()) {

      return;

    }


    const data =
      snap.data();


    $("lessonWriter").value =
      data.writer || "";


    $("everyoneNote").value =
      data.everyoneNote || "";


    $("teacherNote").value =
      data.teacherNote || "";


    for (
      let i = 1;
      i <= 6;
      i++
    ) {

      const p =
        data.periods?.[
          String(i)
        ] || {};


      $(`lessonSubject${i}`)
        .value =
          p.subject || "";


      $(`lessonText${i}`)
        .value =
          p.text || "";

    }


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   授業内容保存
===================================== */

async function saveLesson() {

  const date =
    $("lessonDate").value;


  if (!date) {

    showToast(
      "日付を選んでください。"
    );

    return;

  }


  const periods = {};


  for (
    let i = 1;
    i <= 6;
    i++
  ) {

    periods[String(i)] = {

      subject:
        $(`lessonSubject${i}`)
          .value
          .trim(),

      text:
        $(`lessonText${i}`)
          .value
          .trim()

    };

  }


  try {

    await setDoc(

      doc(

        db,

        "classes",

        state.classId,

        "lessonReports",

        date

      ),

      {

        date,

        writer:
          $("lessonWriter")
            .value
            .trim(),

        periods,

        everyoneNote:
          $("everyoneNote")
            .value
            .trim(),

        teacherNote:
          $("teacherNote")
            .value
            .trim(),

        updatedBy:
          state.user.uid,

        updatedByName:
          state.profile.displayName,

        updatedAt:
          serverTimestamp()

      },

      {
        merge: true
      }

    );


    showToast(
      "授業内容を保存しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   授業内容削除
===================================== */

async function deleteLesson() {

  const date =
    $("lessonDate").value;


  if (!date) {

    return;

  }


  if (

    !confirm(

      `${date} の授業内容を削除しますか？\n` +

      "この変更はクラス全員に反映されます。"

    )

  ) {

    return;

  }


  try {

    await deleteDoc(

      doc(

        db,

        "classes",

        state.classId,

        "lessonReports",

        date

      )

    );


    clearLessonForm();


    showToast(
      "削除しました。"
    );


  } catch (error) {

    showToast(
      friendlyError(error)
    );

  }

}


/* =====================================
   生徒・先生表示
===================================== */

function formatRole(role) {

  return role === "teacher"
    ? "先生"
    : "生徒";

}


/* =====================================
   アカウント情報表示
===================================== */

function renderAccount() {

  $("accountInfo").textContent =

    `${state.profile?.displayName || ""}` +

    " / " +

    `${formatRole(
      state.profile?.role
    )}`;

}


/* =====================================
   HTML安全化
===================================== */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =====================================
   改行表示
===================================== */

function nl2br(value) {

  return escapeHtml(value)
    .replaceAll(
      "\n",
      "<br>"
    );

}


/* =====================================
   新規アカウント登録
===================================== */

$("signupButton")
  .addEventListener(

    "click",

    async () => {


      const displayName =
        $("signupName")
          .value
          .trim();


      const role =
        $("signupRole").value;


      const email =
        $("signupEmail")
          .value
          .trim();


      const password =
        $("signupPassword").value;


      if (

        !displayName ||

        !email ||

        password.length < 6

      ) {

        showToast(

          "表示名・メール・6文字以上のパスワードを入力してください。"

        );

        return;

      }


      try {


        const credential =

          await createUserWithEmailAndPassword(

            auth,

            email,

            password

          );


        await setDoc(

          doc(

            db,

            "users",

            credential.user.uid

          ),

          {

            displayName,

            role,

            createdAt:
              serverTimestamp()

          }

        );


        showToast(
          "アカウントを作成しました。"
        );


      } catch (error) {

        showToast(
          friendlyError(error)
        );

      }

    }

  );


/* =====================================
   ログイン
===================================== */

$("loginButton")
  .addEventListener(

    "click",

    async () => {


      try {

        await signInWithEmailAndPassword(

          auth,

          $("loginEmail")
            .value
            .trim(),

          $("loginPassword")
            .value

        );


      } catch (error) {

        showToast(
          friendlyError(error)
        );

      }

    }

  );


/* =====================================
   ログアウト
===================================== */

$("logoutButton")
  .addEventListener(

    "click",

    async () => {

      await signOut(auth);

    }

  );


/* =====================================
   クラス作成
===================================== */

$("createClassButton")
  .addEventListener(

    "click",

    createClass

  );


/* =====================================
   クラス参加
===================================== */

$("joinClassButton")
  .addEventListener(

    "click",

    joinClass

  );


/* =====================================
   ホーム3ボタン
===================================== */

document

  .querySelectorAll(
    "[data-open]"
  )

  .forEach(

    (button) => {


      button.addEventListener(

        "click",

        async () => {


          const view =
            button.dataset.open;


          openView(view);


          if (
            view === "lessonView"
          ) {


            const today =
              new Date();


            const yyyy =
              today.getFullYear();


            const mm =
              String(
                today.getMonth() + 1
              )
                .padStart(
                  2,
                  "0"
                );


            const dd =
              String(
                today.getDate()
              )
                .padStart(
                  2,
                  "0"
                );


            $("lessonDate").value =
              `${yyyy}-${mm}-${dd}`;


            await loadLesson();

          }

        }

      );

    }

  );


/* =====================================
   戻るボタン
===================================== */

$("backButton")
  .addEventListener(

    "click",

    () => {


      if (state.classId) {

        openView(
          "homeView"
        );

      } else {

        openView(
          "classView"
        );

      }

    }

  );


/* =====================================
   アカウントボタン
===================================== */

$("accountButton")
  .addEventListener(

    "click",

    () => {

      renderAccount();

      openView(
        "accountView"
      );

    }

  );


/* =====================================
   クラス選択へ
===================================== */

$("changeClassButton")
  .addEventListener(

    "click",

    async () => {


      stopRealtimeListeners();


      state.classId =
        null;


      state.classData =
        null;


      await renderMyClasses();


      openView(
        "classView"
      );

    }

  );


/* =====================================
   提出物追加ボタン
===================================== */

$("addAssignmentButton")
  .addEventListener(

    "click",

    () => {

      openAssignmentDialog();

    }

  );


/* =====================================
   提出物保存ボタン
===================================== */

$("saveAssignmentButton")
  .addEventListener(

    "click",

    (event) => {


      event.preventDefault();


      saveAssignment();

    }

  );


/* =====================================
   時間割保存ボタン
===================================== */

$("saveCellButton")
  .addEventListener(

    "click",

    (event) => {


      event.preventDefault();


      saveCell();

    }

  );


/* =====================================
   時間割削除ボタン
===================================== */

$("deleteCellButton")
  .addEventListener(

    "click",

    (event) => {


      event.preventDefault();


      deleteCell();

    }

  );


/* =====================================
   行事追加
===================================== */

$("addEventButton")
  .addEventListener(

    "click",

    () => {

      openEventDialog();

    }

  );


/* =====================================
   行事保存
===================================== */

$("saveEventButton")
  .addEventListener(

    "click",

    (event) => {


      event.preventDefault();


      saveEvent();

    }

  );


/* =====================================
   授業内容の日付読込
===================================== */

$("loadLessonButton")
  .addEventListener(

    "click",

    loadLesson

  );


$("lessonDate")
  .addEventListener(

    "change",

    loadLesson

  );


/* =====================================
   授業内容保存
===================================== */

$("saveLessonButton")
  .addEventListener(

    "click",

    saveLesson

  );


/* =====================================
   授業内容削除
===================================== */

$("deleteLessonButton")
  .addEventListener(

    "click",

    deleteLesson

  );


/* =====================================
   初期画面作成
===================================== */

buildLessonPeriods();

renderTimetable();


/* =====================================
   ログイン状態監視
===================================== */

onAuthStateChanged(

  auth,

  async (user) => {


    stopRealtimeListeners();


    state.user =
      user;


    state.profile =
      null;


    state.classId =
      null;


    state.classData =
      null;


    if (!user) {

      openView(
        "authView"
      );

      return;

    }


    try {


      await loadProfile(
        user.uid
      );


      if (!state.profile) {

        showToast(
          "ユーザープロフィールが見つかりません。"
        );


        await signOut(
          auth
        );


        return;

      }


      $("createClassCard")
        .hidden =
          state.profile.role
          !== "teacher";


      await renderMyClasses();


      openView(
        "classView"
      );


    } catch (error) {

      showToast(
        friendlyError(error)
      );

    }

  }

);
