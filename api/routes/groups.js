const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');

router.post('/', groupsController.createGroup);
router.get('/:user_id', groupsController.getGroupsByUser);
router.get('/own/:user_id', groupsController.getOwnGroupsByUser); // Groupes propres
router.get('/tiers', groupsController.getTiersGroups); // Groupes tiers
router.put('/:id/disable', groupsController.disableGroup);
router.put('/:id/enable', groupsController.enableGroup);
router.delete('/:id', groupsController.deleteGroup);
router.get('/logs', groupsController.getGroupLogs);
router.put('/admin-status/:id', groupsController.updateAdminStatus);
router.get('/admin/:user_id', groupsController.getAdminGroupsByUser);

module.exports = router;