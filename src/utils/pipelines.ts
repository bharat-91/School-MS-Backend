import { User } from '../model';
import mongoose, { PipelineStage } from 'mongoose';
import { Request } from 'express'
interface filterPipelineArgs {
  departmentName: string;
  teacherName: string;
  subjectName: string;
  studentName: string;
  pageNumber: number;
  pageLimit: number;
  pageSort: number;
}

interface paginationParams {
  pageNumber: number;
  pageLimit: number;
  pageSort: number
}


const addPaginationStages = ({ pageNumber, pageLimit, pageSort }: paginationParams): PipelineStage[] => {
  return [
    // { $sort: { departmentName: pageSort } },
    { $skip: (pageNumber - 1) * pageLimit },
    { $limit: pageLimit }
  ];
};
//Filter Query 
export const filterPipeline = async ({ departmentName, teacherName, subjectName, studentName, pageNumber, pageLimit, pageSort, ...filters }: filterPipelineArgs) => {
  const userName = teacherName;

  const teacher = await User.findOne({ userName });
  const foundTeacherName = teacher?.userName;

  console.log(foundTeacherName);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        departmentName
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher',
        foreignField: '_id',
        as: 'teacherDetails'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'students.studentId',
        foreignField: '_id',
        as: 'studentDetails'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'subjects.teacherId',
        foreignField: '_id',
        as: 'subjectTeacherDetails'
      }
    },
    {
      $unwind: '$studentDetails'
    },
    {
      $unwind: '$subjects'
    },
    {
      $unwind: '$subjectTeacherDetails'
    },
    {
      $addFields: {
        studentName: '$studentDetails.userName',
        teacherId: '$subjects.teacherId',
        taughtSub: '$subjects.name',
        teacherName: '$teacherDetails.userName',
        subjectTeacherName: '$subjectTeacherDetails.userName'
      }
    },
    {
      $match: {
        $and: [
          {
            subjectTeacherName: foundTeacherName
          },
          {
            teacherName: foundTeacherName
          },
          {
            taughtSub: subjectName
          },
          {
            studentName
          },
          {
            ...filters
          }
        ]
      }
    },
    ...addPaginationStages({ pageNumber, pageLimit, pageSort }),
    {
      $project: {
        teacherDetails: 0,
        teacherName: 0,
        teacher: 0,
        students: 0,
        subjects: 0
      }
    }
  ];

  return pipeline;
};

//Search Query
export const getAllDepartmentsPipeline = ({ pageNumber, pageLimit, pageSort }: paginationParams): mongoose.PipelineStage[] => {
  const skip = (pageNumber - 1) * pageLimit;

  return [
    {
      $facet: {
        metadata: [
          { $count: "totalDocuments" }
        ],
        data: [
          {
            $lookup: {
              from: 'users',
              localField: 'teacher',
              foreignField: '_id',
              as: 'teacherDetails'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'students.studentId',
              foreignField: '_id',
              as: 'studentDetails'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'subjects.teacherId',
              foreignField: '_id',
              as: 'subjectTeacherDetails'
            }
          },
          {
            $project: {
              departmentName: 1,
              teacherDetails: 1,
              studentDetails: 1,
              subjects: {
                $map: {
                  input: '$subjects',
                  as: 'subject',
                  in: {
                    name: '$$subject.name',
                    teacher: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$subjectTeacherDetails',
                            as: 'teacher',
                            cond: { $eq: ['$$teacher._id', '$$subject.teacherId'] }
                          }
                        }, 0
                      ]
                    }
                  }
                }
              },
              totalStudents: { $size: "$students" },
              totalSubjects: { $size: "$subjects" },
              totalTeachers: { $size: "$teacher" },
            }
          },
          // { $sort: { departmentName: pageSort } },
          { $skip: skip },
          { $limit: pageLimit },
        ]
      }
    },
    {
      $addFields: {
        metadata: {
          $arrayElemAt: ["$metadata", 0]
        }
      }
    }
  ];
};


export const searchDepartmentData = (req: Request): mongoose.PipelineStage[] => {
  const { search, ...filters } = req.query;
  let matchQueries: any = {};

  // Handle search query
  if (search && search.toString().trim() !== "") {
    matchQueries.$or = [
      { "StudentDetails.userName": { $regex: search, $options: 'i' } },
      { "StudentDetails.firstName": { $regex: search, $options: 'i' } },
      { "StudentDetails.lastName": { $regex: search, $options: 'i' } },
      { "StudentDetails.email": { $regex: search, $options: 'i' } },
      { "StudentDetails.phoneNumber": { $regex: search, $options: 'i' } },
      { "StudentDetails.address": { $regex: search, $options: 'i' } },
      { "teacherDetails.userName": { $regex: search, $options: 'i' } },
      { "subjects.name": { $regex: search, $options: 'i' } },
      { "departmentName": { $regex: search, $options: 'i' } }
    ];
  }

  // Handle additional filters
  for (const [key, value] of Object.entries(filters)) {
    switch (key) {
      case 'departmentName':
        matchQueries.departmentName = value;
        break;
      case 'StudentDetails.userName':
        matchQueries["StudentDetails.userName"] = value;
        break;
      case 'address':
        matchQueries["StudentDetails.address"] = value;
        break;
      case 'teacherDetails.userName':
        matchQueries["teacherDetails.userName"] = value;
        break;
      default:
        matchQueries[key] = value;
    }
  }

  const pipeline: mongoose.PipelineStage[] = [
    {
      $lookup: {
        from: "users",
        localField: "teacher",
        foreignField: "_id",
        as: "teacherDetails"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "students.studentId",
        foreignField: "_id",
        as: "StudentDetails"
      }
    },
    {
      $match: matchQueries
    },
    {
      $project: {
        departmentName: 1,
        teacherDetails: {
          $filter: {
            input: "$teacherDetails",
            as: "teacher",
            cond: {
              $or: [
                { $regexMatch: { input: "$$teacher.userName", regex: search, options: 'i' } },
                { $eq: ["$$teacher.userName", filters["teacherDetails.userName"]] }
              ]
            }
          }
        },
        students: {
          $filter: {
            input: "$StudentDetails",
            as: "student",
            cond: {
              $or: [
                { $regexMatch: { input: "$$student.userName", regex: search, options: 'i' } },
                { $eq: ["$$student.userName", filters["StudentDetails.userName"]] }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        StudentDetails: "$students"
      }
    },
    {
      $project: {
        departmentName: 1,
        students: {
          $cond: {
            if: { $eq: ["$StudentDetails", []] },
            then: "$$REMOVE",
            else: "$students"
          }
        },
        teacherDetails: {
          $cond: {
            if: { $eq: ["$teacherDetails", []] },
            then: "$$REMOVE",
            else: "$teacherDetails"
          }
        }
      }
    }
  ];

  return pipeline;
};


export const departmentRevenue = async ({ pageNumber, pageLimit, pageSort }: paginationParams) => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "fees",
        localField: "_id",
        foreignField: "studentId",
        as: "studentFees",
      },
    },
    {
      $unwind: {
        path: "$studentFees",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "students.studentId",
        as: "departmentInfo",
      },
    },
    {
      $unwind: {
        path: "$departmentInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          departmentId: "$departmentInfo._id",
          studentId: "$_id",
        },
        departmentName: { $first: "$departmentInfo.departmentName" },
        totalFeesCollected: { $sum: { $cond: { if: "$studentFees", then: "$studentFees.amount", else: 0 } } },
        totalPenaltyCollected: { $sum: { $cond: { if: "$studentFees", then: "$studentFees.penalty", else: 0 } } },
        hasPaidFees: { $max: { $cond: { if: "$studentFees", then: true, else: false } } },
      },
    },
    {
      $group: {
        _id: "$_id.departmentId",
        departmentName: { $first: "$departmentName" },
        totalStudents: { $sum: 1 },
        totalFeesCollected: { $sum: "$totalFeesCollected" },
        totalPenaltyCollected: { $sum: "$totalPenaltyCollected" },
        students: {
          $push: {
            studentId: "$_id.studentId",
            hasPaidFees: "$hasPaidFees",
          },
        },
        totalPaidStudents: {
          $sum: { $cond: { if: "$hasPaidFees", then: 1, else: 0 } }
        },
      },
    },
    {
      $match: {
        totalPaidStudents: { $gt: 0 } // Filter out departments with no paid students
      }
    },
    ...addPaginationStages({ pageNumber, pageLimit, pageSort }),
    {
      $project: {
        _id: 0,
        departmentId: "$_id",
        departmentName: 1,
        totalStudents: 1,
        totalFeesCollected: 1,
        totalPenaltyCollected: 1,
        totalPaidStudents: {
          $size: {
            $filter: {
              input: "$students",
              as: "student",
              cond: { $eq: ["$$student.hasPaidFees", true] },
            },
          },
        },
        totalUnpaidStudents: {
          $size: {
            $filter: {
              input: "$students",
              as: "student",
              cond: { $eq: ["$$student.hasPaidFees", false] },
            },
          },
        },
        students: {
          $cond: {
            if: { $eq: ["$students", []] },
            then: [],
            else: "$students",
          },
        },
      },
    },
  ];


  return pipeline
}

export function departmentToppersPipeline(departmentName: string, top: number, page: number, limit: number, sort: number): PipelineStage[] {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                $and: [
                    { $or: [
                        { departmentName: { $exists: true } },
                        { status: "Pass" }
                    ]}
                ]
            },
        },
        {
            $sort: {
                // departmentName: sort,
                percentage: -1
            }
        },
        {
            $match: {
                status: "Pass"
            }
        },
        {
            $group: {
                _id: "$departmentName",
                toppers: {
                    $push: {
                        studentId: "$studentId",
                        studentName: "$studentName",
                        totalMarks: "$totalMarks",
                        obtainMarks: "$obtainMarks",
                        percentage: "$percentage",
                        grade: "$grade",
                        rank: "$rank",
                        status: "$status"
                    }
                },
                overallPassingPercentage: {
                    $avg: "$percentage"
                }
            }
        },
        {
            $project: {
                _id: 0,
                departmentName: "$_id",
                toppers: {
                    $slice: ["$toppers", top]
                },
                overallPassingPercentage: {
                    $round: ["$overallPassingPercentage", 2]
                }
            }
        },
        // Pagination stages
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
        // Union with university toppers
        {
            $facet: {
                departmentToppers: [
                    { $sort: { 
                      // departmentName: sort, 
                      percentage: -1 } },
                    { $limit: top }
                ],
                universityToppers: [
                    { $sort: { percentage: -1 } },
                    { $limit: top }
                ]
            }
        }
    ];

    return pipeline;
}

export function universityToppersPipeline(top: number, page: number, limit: number, sort: number): PipelineStage[] {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                status: "Pass"
            }
        },
        {
            $sort: {
                percentage: -1
            }
        },
        {
            $group: {
                _id: null,
                allToppers: {
                    $push: {
                        studentId: "$studentId",
                        studentName: "$studentName",
                        departmentName: "$departmentName",
                        totalMarks: "$totalMarks",
                        obtainMarks: "$obtainMarks",
                        percentage: "$percentage",
                        grade: "$grade",
                        rank: "$rank",
                        status: "$status",
                        departmentNames: "$departmentName"
                    }
                }
            }
        },
        {
            $unwind: "$allToppers"
        },
        {
            $sort: {
                "allToppers.percentage": -1
            }
        },
        {
            $limit: top
        }
    ];

    return pipeline;
}


// export const test = async (
//   departmentName: string,
//   topStudent: number,
//   pageNumber: number,
//   pageLimit: number,
//   pageSort: any
// ) => {
//   const pipeline: PipelineStage[] =  [
//     {
//       $match: {
//         $and: [
//           { $or: [
//             { departmentName: { $exists: true } },
//             { status: "Pass" }
//           ]
        
//         }
//       ]
//       },
//     },
//     {
//       $sort: {
//         departmentName: 1,
//         percentage: -1
//       }
//     },
//     {
//       $match: {
//         status: "Pass"
//       }
//     },
//     {
//       $group: {
//         _id: "$departmentName",
//         toppers: {
//           $push: {
//             studentId: "$studentId",
//             studentName: "$studentName",
//             totalMarks: "$totalMarks",
//             obtainMarks: "$obtainMarks",
//             percentage: "$percentage",
//             grade: "$grade",
//             rank: "$rank",
//             status: "$status"
//           }
//         },
//         overallPassingPercentage: {
//           $avg: "$percentage"
//         }
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         departmentName: "$_id",
//         toppers: {
//           $slice: ["$toppers", 3]
//         },
//         overallPassingPercentage: {
//           $round: ["$overallPassingPercentage", 2]
//         }
//       }
//     },
//     {
//       $skip: (pageNumber - 1) * pageLimit
//     },
//     {
//       $limit: pageLimit
//     },
//     {
//       $facet: {
//         departmentToppers: [
//           { $sort: { departmentName: 1, percentage: -1 } },
//           { $limit: 3 }
//         ],
//         universityToppers: [
//           { $sort: { percentage: -1 } },
//           { $limit: 3 }
//         ]
//       }
//     }
//   ]

//   return pipeline;
// };