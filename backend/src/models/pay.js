const db = require('../config/db');

const Pay = {
    getPayByTimeEntryId: (timeEntryId, callback) => {
        db.query('SELECT * FROM pay WHERE time_entry_id = ?', [timeEntryId], callback);
    },

    addPay: (timeEntryId, amount, callback) => {
        db.query('INSERT INTO pay (time_entry_id, pay) VALUES (?, ?)', [timeEntryId, amount], callback);
    },

    deletePay: (payId, callback) => {
        db.query('DELETE FROM pay WHERE id = ?', [payId], callback);
    }
};

module.exports = Pay;
