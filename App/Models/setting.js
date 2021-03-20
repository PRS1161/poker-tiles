const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingSchema = new Schema({
	defaultChips: {
		type: 'number',
		default: 0
	},
	rakePercenage: {
		type: 'number',
		default: 0
	},
	maintenance:Schema.Types.Mixed,	
	BackupDetails:Schema.Types.Mixed,
	processId: {
		type: 'number',
		default: 0
	},
	systemChips: {
		type: 'number',
		default: 0
	}		
},{ collection: 'setting' });

mongoose.model('setting', SettingSchema);
 
