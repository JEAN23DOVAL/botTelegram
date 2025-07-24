const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/upsert', usersController.upsertUser);
router.put('/:id/role-forfait', usersController.updateRoleOrForfait);
router.put('/:id/disable', usersController.disableUser);
router.put('/:id/enable', usersController.enableUser);
router.delete('/:id', usersController.deleteUser);
router.get('/admin/logs', usersController.getAdminLogs);

module.exports = router;