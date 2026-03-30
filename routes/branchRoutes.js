// const express = require("express");
// const router = express.Router();


// const {
//   getBranches,
//   getSingleBranch,
//   createBranch,
//   updateBranch,
//   searchBranchesByPincode,
//   toggleBranchStatus,
//   getDashboardSummary
// } = require("../controllers/branchController");
// // const {
// //   getBranches,
// //   getSingleBranch,
// //   createBranch,
// //   updateBranch,
// //   searchBranchesByPincode,
// //   toggleBranchStatus,
// //   getDashboardSummary 
// // } = require("../controllers/branchController");

// // router.get("/", getBranches);
// // // router.get("/search/pincode", searchBranchByPincode);
// // router.get("/dashboard-summary", getDashboardSummary);
// // router.get("/:id", getSingleBranch);
// // router.post("/", createBranch);
// // router.put("/:id", updateBranch);
// // router.put("/toggle/:id", toggleBranchStatus);

// // router.get("/search-by-pincode", searchBranchesByPincode);

// router.get("/", getBranches);
// router.get("/search-by-pincode", searchBranchesByPincode);
// router.get("/dashboard-summary", getDashboardSummary);

// router.post("/", createBranch);
// router.put("/:id", updateBranch);
// router.put("/toggle/:id", toggleBranchStatus);

// router.get("/:id", getSingleBranch); // always last


// module.export = router



const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const branchController = require("../controllers/branchController");

router.get("/", verifyToken, checkRole("admin"), branchController.getBranches);
router.get("/search-by-pincode", verifyToken, checkRole("admin"), branchController.searchBranchesByPincode);
router.get("/dashboard-summary", verifyToken,checkRole("admin"),branchController.getDashboardSummary);
router.get("/:id", verifyToken, checkRole("admin"), branchController.getSingleBranch);

router.post("/", verifyToken, checkRole("admin"), branchController.createBranch);
router.put("/:id", verifyToken, checkRole("admin"), branchController.updateBranch);
router.put("/toggle/:id", verifyToken, checkRole("admin"), branchController.toggleBranchStatus);


module.exports = router;