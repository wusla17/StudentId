
import axios from 'axios';

// IMPORTANT: Replace with your Google Sheets API Key and Sheet ID
const API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY';
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'Students';

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}`;

export interface Guardian {
  name: string;
  photo: string;
  relation: string;
}

export interface Student {
  studentId: string;
  studentName: string;
  photoUrl: string;
  phoneNumber: string;
  password?: string; // Password might not always be fetched
  feeBalance: number;
  leavesTaken: number;
  pushToken?: string;
  guardians: Guardian[];
  rowIndex: number; // To know which row to update
}

// Helper to map a sheet row to a Student object
const mapRowToStudent = (row: any[], rowIndex: number): Student => {
  const guardians: Guardian[] = [];
  for (let i = 7; i < row.length; i += 3) {
    if (row[i] && row[i+1] && row[i+2]) {
      guardians.push({
        name: row[i],
        photo: row[i+1],
        relation: row[i+2],
      });
    }
  }

  return {
    studentId: row[0],
    studentName: row[1],
    photoUrl: row[2],
    phoneNumber: row[3],
    password: row[4],
    feeBalance: parseFloat(row[5]),
    leavesTaken: parseInt(row[6], 10),
    pushToken: row[13],
    guardians,
    rowIndex: rowIndex + 1, // Sheets are 1-indexed
  };
};

// Function to get all student data
const getAllStudents = async (): Promise<Student[]> => {
  try {
    const response = await axios.get(`${BASE_URL}?key=${API_KEY}`);
    const rows = response.data.values;
    if (rows.length) {
      // Skip header row by starting from index 1
      return rows.slice(1).map((row: any[], index: number) => mapRowToStudent(row, index + 1));
    }
    return [];
  } catch (error) {
    console.error("Error fetching student data:", error);
    throw new Error("Could not fetch student data. Please check your internet connection.");
  }
};

// Function to find a student by phone number for login
export const getStudentByPhone = async (phoneNumber: string): Promise<Student | null> => {
  try {
    const students = await getAllStudents();
    return students.find(student => student.phoneNumber === phoneNumber) || null;
  } catch (error) {
    throw error;
  }
};

// Function to find a student by student ID (from QR code)
export const getStudentById = async (studentId: string): Promise<Student | null> => {
    try {
        const students = await getAllStudents();
        return students.find(student => student.studentId === studentId) || null;
    } catch (error) {
        throw error;
    }
};


// Generic function to update a specific cell
const updateCell = async (rowIndex: number, colIndex: number, value: string | number) => {
    const range = `${SHEET_NAME}!${String.fromCharCode(65 + colIndex)}${rowIndex}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`;

    try {
        await axios.put(url, {
            values: [[value]],
        });
    } catch (error) {
        console.error(`Error updating cell ${range}:`, error);
        throw new Error("Failed to update data in the sheet.");
    }
};


// Function to update a user's password
export const updatePassword = async (rowIndex: number, newPassword: string): Promise<void> => {
    // Assuming password is in column E (index 4)
    await updateCell(rowIndex, 4, newPassword);
};

// Function to grant leave
export const grantLeave = async (rowIndex: number, currentLeaves: number): Promise<void> => {
    // Assuming leavesTaken is in column G (index 6)
    await updateCell(rowIndex, 6, currentLeaves + 1);
};

// Function to update fee balance
export const updateFeeBalance = async (rowIndex: number, newBalance: number): Promise<void> => {
    // Assuming feeBalance is in column F (index 5)
    await updateCell(rowIndex, 5, newBalance);
};

// Function to update push token
export const updatePushToken = async (rowIndex: number, token: string): Promise<void> => {
    // Assuming pushToken is in column N (index 13)
    await updateCell(rowIndex, 13, token);
};
