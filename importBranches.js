// const xlsx = require("xlsx");
// const bcrypt = require("bcrypt");
// const pool = require("./config/db");

// const workbook = xlsx.readFile("BeetleNut_Data (2) (1).xlsx");
// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = xlsx.utils.sheet_to_json(sheet);

// async function importData() {
//   try {

//     for (let row of data) {

//       const address = row["Address"];
//       const city = row["City"];
//       const contact = row["Contact Number"];
//       const incharge = row["Branch Incharge"];
//       const pincodes = row["Pincode covered"];
//       const branchName = row["Branch Name"]?.trim();

//       const username = incharge.toLowerCase().replace(/\s/g, "");

//       // 🔥 Hash password properly
//       const hashedPassword = await bcrypt.hash("1234", 10);

//       const branchResult = await pool.query(
//         `INSERT INTO branches 
//          (branch_name, address, city, contact_number, branch_incharge, username, password)
//          VALUES ($1,$2,$3,$4,$5,$6,$7)
//          ON CONFLICT (address, city) DO NOTHING
//          RETURNING id`,
//         [
//           branchName,
//           address,
//           city,
//           contact,
//           incharge,
//           username,
//           hashedPassword   // 🔥 use hashed password
//         ]
//       );

//       let branchId;

//       if (branchResult.rows.length > 0) {
//         branchId = branchResult.rows[0].id;
//       } else {
//         const existingBranch = await pool.query(
//           "SELECT id FROM branches WHERE address=$1 AND city=$2",
//           [address, city]
//         );
//         branchId = existingBranch.rows[0].id;

//         // 🔥 Also update username + password for existing branches
//         await pool.query(
//           `UPDATE branches
//            SET username=$1, password=$2
//            WHERE id=$3`,
//           [username, hashedPassword, branchId]
//         );
//       }

//       const pincodeArray = [...new Set(String(pincodes).split(","))];

//       for (let pin of pincodeArray) {
//         await pool.query(
//           `INSERT INTO branch_pincodes (branch_id, pincode)
//            VALUES ($1,$2)
//            ON CONFLICT (branch_id, pincode) DO NOTHING`,
//           [branchId, pin.trim()]
//         );
//       }

//     }

//     console.log("Excel data imported successfully (No duplicates)");
//     process.exit();

//   } catch (err) {
//     console.error(err);
//   }
// }

// importData();

const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const workbook = xlsx.readFile("BeetleNut_Data (2) (1).xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

async function importData() {
  try {

    for (let row of data) {

      const address = row["Address"];
      const city = row["City"];
      const contact = row["Contact Number"];
      const incharge = row["Branch Incharge"];
      const pincodes = row["Pincode covered"];
      const branchName = row["Branch Name"]?.trim();

      // create username
      const username = incharge.toLowerCase().replace(/\s/g, "");

      // create email automatically
      const email = username + "@gmail.com";

      // hash password
      const hashedPassword = await bcrypt.hash("1234", 10);

      // -------------------------------
      // INSERT / GET BRANCH
      // -------------------------------

      const branchResult = await pool.query(
        `INSERT INTO branches 
         (branch_name, address, city, contact_number, branch_incharge)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (address, city) DO NOTHING
         RETURNING id`,
        [
          branchName,
          address,
          city,
          contact,
          incharge
        ]
      );

      let branchId;

      if (branchResult.rows.length > 0) {
        branchId = branchResult.rows[0].id;
      } else {
        const existingBranch = await pool.query(
          "SELECT id FROM branches WHERE address=$1 AND city=$2",
          [address, city]
        );
        branchId = existingBranch.rows[0].id;
      }

      // -------------------------------
      // INSERT / GET USER
      // -------------------------------

      const userResult = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1,$2,$3,'branch_user')
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [incharge, email, hashedPassword]
      );

      let userId;

      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        const existingUser = await pool.query(
          "SELECT id FROM users WHERE email=$1",
          [email]
        );
        userId = existingUser.rows[0].id;
      }

      // -------------------------------
      // MAP USER → BRANCH
      // -------------------------------

      await pool.query(
        `INSERT INTO branch_user_mapping (user_id, branch_id)
         VALUES ($1,$2)
         ON CONFLICT (user_id, branch_id) DO NOTHING`,
        [userId, branchId]
      );

      // -------------------------------
      // INSERT PINCODES
      // -------------------------------

      const pincodeArray = [...new Set(String(pincodes).split(","))];

      for (let pin of pincodeArray) {

        await pool.query(
          `INSERT INTO branch_pincodes (branch_id, pincode)
           VALUES ($1,$2)
           ON CONFLICT (branch_id, pincode) DO NOTHING`,
          [branchId, pin.trim()]
        );

      }

    }

    console.log("✅ Excel data imported successfully");
    process.exit();

  } catch (err) {
    console.error("❌ Error importing data:", err);
  }
}

importData();



// const xlsx = require("xlsx");
// const pool = require("./config/db");

// const workbook = xlsx.readFile("BeetleNut_Data (2) (1).xlsx");
// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = xlsx.utils.sheet_to_json(sheet);

// async function importData() {
//   try {

//     for (let row of data) {

//       const address = row["Address"];
//       const city = row["City"];
//       const contact = row["Contact Number"];
//       const incharge = row["Branch Incharge"];
//       const pincodes = row["Pincode covered"];
//       const branchName = row["Branch Name"]?.trim();
      

//       //  Insert branch (avoid duplicate)
//       // const branchResult = await pool.query(
//       //   `INSERT INTO branches 
//       //    (branch_name,address, city, contact_number, branch_incharge, username, password)
//       //    VALUES ($1,$2,$3,$4,$5,$6)
//       //    ON CONFLICT (address, city) DO NOTHING
//       //    RETURNING id`,
//       //   [
//       //     branchName,
//       //     address,
//       //     city,
//       //     contact,
//       //     incharge,
//       //     incharge.toLowerCase().replace(/\s/g, ""),
//       //     "1234"
//       //   ]
//       // );

//       const branchResult = await pool.query(
//   `INSERT INTO branches 
//    (branch_name, address, city, contact_number, branch_incharge, username, password)
//    VALUES ($1,$2,$3,$4,$5,$6,$7)
//    ON CONFLICT (address, city) DO NOTHING
//    RETURNING id`,
//   [
//     branchName,
//     address,
//     city,
//     contact,
//     incharge,
//     incharge.toLowerCase().replace(/\s/g, ""),
//     "1234"
//   ]
// );

//       let branchId;

//       if (branchResult.rows.length > 0) {
//         branchId = branchResult.rows[0].id;
//       } else {
//         // If already exists, get existing branch id
//         const existingBranch = await pool.query(
//           "SELECT id FROM branches WHERE address=$1 AND city=$2",
//           [address, city]
//         );
//         branchId = existingBranch.rows[0].id;
//       }

//       //  Remove duplicate pincodes inside same row
//       const pincodeArray = [...new Set(String(pincodes).split(","))];

//       for (let pin of pincodeArray) {

//         await pool.query(
//           `INSERT INTO branch_pincodes (branch_id, pincode)
//            VALUES ($1,$2)
//            ON CONFLICT (branch_id, pincode) DO NOTHING`,
//           [branchId, pin.trim()]
//         );
//       }

//     }

//     console.log("Excel data imported successfully (No duplicates)");
//     process.exit();

//   } catch (err) {
//     console.error(err);
//   }
// }

// importData();