const STORAGE_KEY = "studentAttendanceRecords";

const studentForm = document.getElementById("studentForm");
const studentNameInput = document.getElementById("studentName");
const rollNumberInput = document.getElementById("rollNumber");
const studentClassInput = document.getElementById("studentClass");
const searchInput = document.getElementById("searchInput");
const studentTableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const clearAllBtn = document.getElementById("clearAllBtn");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const attendanceRate = document.getElementById("attendanceRate");
const todayDate = document.getElementById("todayDate");

let students = loadStudents();
let activeFilter = "all";

todayDate.textContent = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

studentForm.addEventListener("submit", addStudent);
searchInput.addEventListener("input", renderStudents);
clearAllBtn.addEventListener("click", clearAllStudents);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderStudents();
  });
});

renderStudents();

function loadStudents() {
  const savedStudents = localStorage.getItem(STORAGE_KEY);
  return savedStudents ? JSON.parse(savedStudents) : [];
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function addStudent(event) {
  event.preventDefault();

  const name = studentNameInput.value.trim();
  const rollNumber = rollNumberInput.value.trim();
  const studentClass = studentClassInput.value.trim();

  if (!name || !rollNumber || !studentClass) {
    return;
  }

  const rollAlreadyExists = students.some(
    (student) => student.rollNumber.toLowerCase() === rollNumber.toLowerCase()
  );

  if (rollAlreadyExists) {
    alert("A student with this roll number already exists.");
    return;
  }

  students.push({
    id: crypto.randomUUID(),
    name,
    rollNumber,
    studentClass,
    status: "absent"
  });

  saveStudents();
  studentForm.reset();
  studentNameInput.focus();
  renderStudents();
}

function renderStudents() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm) ||
      student.rollNumber.toLowerCase().includes(searchTerm) ||
      student.studentClass.toLowerCase().includes(searchTerm);

    const matchesFilter = activeFilter === "all" || student.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  studentTableBody.innerHTML = "";

  visibleStudents.forEach((student) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(student.name)}</td>
      <td>${escapeHTML(student.rollNumber)}</td>
      <td>${escapeHTML(student.studentClass)}</td>
      <td>
        <span class="status-badge status-${student.status}">
          ${capitalize(student.status)}
        </span>
      </td>
      <td>
        <div class="action-row">
          <button type="button" class="present-btn" data-action="present" data-id="${student.id}">Present</button>
          <button type="button" class="absent-btn" data-action="absent" data-id="${student.id}">Absent</button>
          <button type="button" class="delete-btn" data-action="delete" data-id="${student.id}">Delete</button>
        </div>
      </td>
    `;

    studentTableBody.appendChild(row);
  });

  emptyState.textContent = students.length
    ? "No records match your search or filter."
    : "No student records yet. Add a student to begin.";
  emptyState.classList.toggle("show", visibleStudents.length === 0);

  updateSummary();
}

studentTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const studentId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "delete") {
    students = students.filter((student) => student.id !== studentId);
  } else {
    students = students.map((student) =>
      student.id === studentId ? { ...student, status: action } : student
    );
  }

  saveStudents();
  renderStudents();
});

function updateSummary() {
  const presentStudents = students.filter((student) => student.status === "present").length;
  const absentStudents = students.filter((student) => student.status === "absent").length;
  const rate = students.length ? Math.round((presentStudents / students.length) * 100) : 0;

  totalCount.textContent = students.length;
  presentCount.textContent = presentStudents;
  absentCount.textContent = absentStudents;
  attendanceRate.textContent = `${rate}%`;
}

function clearAllStudents() {
  if (!students.length) {
    return;
  }

  const confirmed = confirm("Are you sure you want to delete all student records?");

  if (!confirmed) {
    return;
  }

  students = [];
  saveStudents();
  renderStudents();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHTML(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
