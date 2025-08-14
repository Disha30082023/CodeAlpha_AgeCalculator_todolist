// Grab elements
const ageForm = document.getElementById('age-form');
const dobInput = document.getElementById('dob');
const dobError = document.getElementById('dob-error');
const resultSection = document.getElementById('result');
const yearsOutput = document.getElementById('years');
const monthsOutput = document.getElementById('months');
const daysOutput = document.getElementById('days');

// Set max date for DOB input to today (no future DOB)
function setMaxDOB() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months: 0-11, add 1
  const dd = String(today.getDate()).padStart(2, '0');
  const maxDate = `${yyyy}-${mm}-${dd}`;
  dobInput.setAttribute('max', maxDate);
}

setMaxDOB();

// Calculate age in years, months, days given DOB
function calculateAge(dateOfBirth) {
  const today = new Date();

  let years = today.getFullYear() - dateOfBirth.getFullYear();
  let months = today.getMonth() - dateOfBirth.getMonth();
  let days = today.getDate() - dateOfBirth.getDate();

  if (days < 0) {
    months--;
    // days in previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

// Animate numbers with class toggle
function animateNumber(element) {
  element.classList.add('animate');
  setTimeout(() => element.classList.remove('animate'), 500);
}

// Form submission handler
ageForm.addEventListener('submit', e => {
  e.preventDefault();
  dobError.textContent = "";
  resultSection.classList.add('hidden');

  const dobValue = dobInput.value;

  if (!dobValue) {
    dobError.textContent = "Please enter your Date of Birth.";
    dobInput.focus();
    return;
  }

  const dobDate = new Date(dobValue);

  if (dobDate > new Date()) {
    dobError.textContent = "Date of Birth cannot be in the future.";
    dobInput.focus();
    return;
  }

  const age = calculateAge(dobDate);

  // Display results
  yearsOutput.textContent = age.years;
  monthsOutput.textContent = age.months;
  daysOutput.textContent = age.days;

  // Animate values
  animateNumber(yearsOutput);
  animateNumber(monthsOutput);
  animateNumber(daysOutput);

  resultSection.classList.remove('hidden');
});
