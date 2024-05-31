import ITAndCSSubjects from "../enum/subjects.enum";
import { User } from "../model";
import { Response } from "express";

const isValidSubject = (subject: string): subject is ITAndCSSubjects => {
    return Object.values(ITAndCSSubjects).includes(subject as ITAndCSSubjects);
};

const isValidTeacher = async (teacherId: string): Promise<boolean> => {
    try {
      const userTeacher = await User.findOne({ _id: teacherId, role: "Teacher" });
      return !!userTeacher;
    } catch (error) {
      console.error("Error Checking the Validity of the user", error);
      return false;
    }
  };

  const isValidStudent = async (studentId: string): Promise<boolean> => {
    try {
      const userStudent = await User.findOne({ _id: studentId, role: "Student" });
      return !!userStudent;
    } catch (error) {
      console.error("Error Checking the Validity of the user", error);
      return false;
    }
  };

  const isValidPrincipal = async (principalId: string): Promise<boolean> => {
    try {
      const userTeacher = await User.findOne({ _id: principalId, role: "Principal" });
      return !!userTeacher;
    } catch (error) {
      console.error("Error Checking the Validity of the user", error);
      return false;
    }
  };


export {isValidSubject,isValidTeacher,isValidStudent,isValidPrincipal}