# YogiTrack — Studio Management System
**Cyber 440 – Penn State Beaver**

YogiTrack is a full-stack web application designed to help a yoga studio manage instructors, classes, customers, packages, attendance, sales, and communications. It is built using the MERN-adjacent stack: MongoDB, Express.js, Node.js, and vanilla HTML/CSS/JavaScript for the frontend.

---

## Table of Contents
- [Running the Project Locally](#running-the-project-locally)
- [User Types](#user-types)
- [Pages and Navigation](#pages-and-navigation)
- [Project Structure](#project-structure)

---

## Running the Project Locally

### Prerequisites
- Node.js installed
- MongoDB installed and running locally
- A `.env` file in the root directory with the following variables:
```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your16characterapppassword
```

### Steps
1. Clone the repository
2. Navigate to the root directory
3. Install dependencies:
```
npm install
```
4. Import the test data into your local MongoDB instance using `mongoimport` for each collection (instructor, class, customer, package, etc.)
5. Start the server:
```
npm start
```
6. Open your browser and navigate to:
```
http://localhost:8080/index.html
```

### Default Admin Account
A manager account must exist in the `credentials` collection before logging in. To create one, use the `setupAdmin.cjs` script (see project documentation). Default credentials for local testing:
- **Email:** admin@yogahom.com
- **Password:** admin123

---

## User Types

YogiTrack has two user roles: **Manager** and **Instructor**. Access is controlled through a session-based login system.

### Manager
Full access to all pages and functionality including:
- Adding, editing, and deleting instructors, classes, customers, and packages
- Recording package sales
- Submitting class attendance
- Viewing all studio reports
- Managing user credentials
- Sending messages to customers

### Instructor
Read-only access to most pages, with the following exceptions:
- Can submit class check-ins
- Can record package sales
- **Cannot** add, edit, or delete any records
- **Cannot** access the Reports or Users pages (hidden from sidebar)

---

## Pages and Navigation

### Login (`index.html`)
The entry point of the application. Enter your email and password to log in. On successful login you are redirected to the dashboard. Invalid credentials display an error message inline.

---

### Dashboard (`dashboard.html`)
The main landing page after login. Contains the sidebar navigation to access all other pages.

---

### Instructors (`instructor.html`)
Manage instructor records.

| Button | Description |
|--------|-------------|
| Search | Clears the form and resets to search mode. Select an instructor from the dropdown to view their details. |
| Add New | Switches to add mode, hiding the dropdown and clearing the form for a new entry. |
| Save | Saves the new instructor to the database. Generates an instructor ID automatically (format: I001, I002, etc.). |
| Delete | Deletes the selected instructor from the database. |
| Exit | Returns to the dashboard. |

**Fields:** Instructor ID (auto-generated), First Name, Last Name, Address, Phone, Email, Preferred Contact (Phone or Email)

---

### Class Schedule (`class.html`)
Manage yoga class schedules.

| Button | Description |
|--------|-------------|
| Search | Resets to search mode. Select a class from the dropdown to view its details. |
| Add New | Switches to add mode for creating a new class. |
| Save | Saves the new class. Checks for scheduling conflicts before saving. If a conflict exists, displays the conflicting class details. |
| Delete | Deletes the selected class. |
| + Add Another Day | Adds an additional day/time/duration row for classes that run multiple times per week. |
| Remove | Removes a specific day/time entry from the list. |
| Exit | Returns to the dashboard. |

**Fields:** Class ID (auto-generated), Class Name, Instructor (dropdown), Class Type (General or Special), Description, Day/Time/Duration entries

**Note:** A class can be scheduled on multiple days per week. Each day/time/duration combination is stored within the same class record.

---

### Customers (`customer.html`)
Manage customer records.

| Button | Description |
|--------|-------------|
| Search | Resets to search mode. Select a customer from the dropdown to view their details. |
| Add New | Switches to add mode for creating a new customer. |
| Save | Validates required fields, then displays the waiver modal for signature before saving. Checks for duplicate names and prompts confirmation if a match is found. Generates a customer ID automatically (format: Y001, Y002, etc.). |
| Delete | Deletes the selected customer. |
| Upload CSV | Opens a file explorer to upload a CSV file of multiple customers at once. |
| Exit | Returns to the dashboard. |

**Fields:** Customer ID (auto-generated), First Name, Last Name, Address, Phone, Email, Preferred Contact (Phone or Email), Senior (checkbox), Class Balance, Opt In for Messages (checkbox)

**Waiver Modal:** When saving a new customer, a popup appears with placeholder waiver text and a signature canvas. The customer must sign before the record can be saved. The signature is stored as a base64 image string in the database.

**CSV Upload Format:**
```
firstName,lastName,email,phone,address,preferredContact,senior,classBalance,optIn
```
Note: `senior` and `optIn` should be `true` or `false`. Signature is not required for CSV uploads.

---

### Packages (`package.html`)
This page contains two forms side by side:

#### Package Form (left)
Manage yoga class packages.

| Button | Description |
|--------|-------------|
| Search | Resets to search mode. Select a package from the dropdown to view its details. |
| Add New | Switches to add mode for creating a new package. |
| Save | Saves the new package. Generates a package ID automatically (P for General packages, S for Senior packages). |
| Delete | Deletes the selected package. |
| Exit | Returns to the dashboard. |

**Fields:** Package ID (auto-generated), Package Name, Package Category (General or Senior), Number of Classes (1, 4, 10, or Unlimited), Class Type (General or Special), Start Date, End Date, Price

#### Package Sale Form (right)
Record package sales to customers.

| Button | Description |
|--------|-------------|
| Search | Resets to search mode. Select a sale from the dropdown to view its details. |
| Add New | Switches to add mode for recording a new sale. |
| Save | Records the sale, updates the customer's class balance based on the package purchased, and generates a sale ID automatically (format: T001, T002, etc.). |
| Delete | Deletes the selected sale record. |
| Exit | Returns to the dashboard. |

**Fields:** Sale ID (auto-generated), Customer (dropdown), Package (dropdown — auto-populates Start Date, End Date, and Amount Paid), Mode of Payment (Cash or Credit/Debit), Purchase Date, Purchase Time, Start Date, End Date

**Note:** When a package is selected, the start date, end date, and amount paid are automatically populated from the package record. Selecting an "Unlimited" package adds 9999 to the customer's class balance.

---

### Check-ins (`checkIn.html`)
Record class attendance.

| Button | Description |
|--------|-------------|
| + Add to List | Adds the selected customer to the attendance list. Checks their class balance and displays ✅ for sufficient balance or ⚠️ for zero/negative balance. Prevents duplicate entries. |
| Submit Attendance | Saves the attendance record, decrements each customer's class balance by 1, and displays warnings for scheduling discrepancies or insufficient balances. Generates an attendance ID automatically (format: AT001, AT002, etc.). |
| Clear | Resets the entire form and clears the attendance list. |
| ✕ (next to customer name) | Removes that customer from the attendance list. |
| Exit | Returns to the dashboard. |

**Fields:** Instructor (dropdown — filters available classes), Class (dropdown — populated based on selected instructor), Date, Time, Customer (dropdown), Attendance List (scrollable)

**Notes:**
- The class dropdown only shows classes assigned to the selected instructor
- A warning is displayed if the submitted date/time doesn't match the class's scheduled day/time
- Customers with zero or negative balance are shown with a ⚠️ warning but can still be added to the list

---

### Reports (`reports.html`)
*Manager only.* Generate studio reports.

| Button | Description |
|--------|-------------|
| Package Sales | Displays a table of all package sales including sale ID, customer name, package name, amount paid, and date. |
| Instructor Report | Displays each instructor with their assigned classes, individual session attendance counts, pay per session, and total pay. Pay is calculated as $20 for fewer than 5 attendees, plus $5 per additional attendee, capped at $60 for 12 or more attendees. |
| Customer Report | Displays each customer with their current class balance and a list of their purchased packages including date of purchase, number of passes, and status (Active, Future, or Expired). |
| Teacher Payment | Currently integrated into the Instructor Report. |
| Clear | Clears the report results area. |
| Exit | Returns to the dashboard. |

---

### Users (`users.html`)
*Manager only.* Manage system user accounts (credentials).

| Button | Description |
|--------|-------------|
| Search | Resets to search mode. Select a user from the dropdown to view their details. |
| Add New | Switches to add mode for creating a new user account. |
| Save | Creates new credentials with a hashed password. Checks for duplicate emails. Generates a user ID automatically (format: U001, U002, etc.). |
| Delete | Deletes the selected user account. Cannot delete your own account. |
| Exit | Returns to the dashboard. |

**Fields:** User ID (auto-generated), First Name, Last Name, Email, Password (hashed with bcrypt), Role (Manager or Instructor)

---

### Messaging (`messaging.html`)
Send email messages to customers who have opted in.

| Button | Description |
|--------|-------------|
| Send | Sends the message to the selected recipient. If "Send to All Opted-In Customers" is selected, sends to all customers with `optIn` set to true. |
| Clear | Clears the subject, message, and resets the recipient dropdown. |
| Exit | Returns to the dashboard. |

**Fields:** Recipient (dropdown — defaults to all opted-in customers, or select a specific customer), Subject, Message

**Note:** Only customers with `optIn` set to true will receive mass messages. Individual messages to a specific customer will also check their opt-in status.

---

## Project Structure

```
yogitrack-prototype/
├── public/
│   ├── htmls/          # All HTML pages
│   ├── js/             # Frontend JavaScript files
│   ├── css/            # Stylesheets
│   └── images/         # Logo and other images
├── routes/             # Express route definitions
├── controllers/        # Business logic and database operations
├── models/             # Mongoose schema definitions
├── config/
│   └── mongodbconn.cjs # MongoDB connection
├── index.html          # Login page (entry point)
├── yogiserver.cjs      # Main Express server
├── package.json
└── .env                # Environment variables (not committed to GitHub)
```

### Tech Stack
- **MongoDB** — Database
- **Express.js** — Backend web framework
- **Node.js** — Server runtime
- **HTML5 / CSS / Vanilla JavaScript** — Frontend
- **Mongoose** — MongoDB object modeling
- **bcrypt** — Password hashing
- **express-session** — Session management
- **multer** — CSV file upload handling
- **csv-parser** — CSV parsing
- **nodemailer** — Email sending

---

## Environment Variables
The following environment variables are required in a `.env` file for local development, or as Heroku Config Vars for deployment:

| Variable | Description |
|----------|-------------|
| `EMAIL_USER` | Gmail address used to send emails |
| `EMAIL_PASS` | Gmail App Password (16 characters) |

---

## Deployment
This application is deployed on **Heroku** and uses **MongoDB Atlas** as the cloud database. The `MONGO_URI` environment variable in Heroku Config Vars points to the Atlas connection string.
