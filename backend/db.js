require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;



// UPDATE zone_visitors SET visitors = CASE WHEN zone = 'zone1' THEN 22 END;
//     
//     WHEN zone = 'zone2' THEN 14
//     WHEN zone = 'zone3' THEN 28
//     WHEN zone = 'zone4' THEN 12
//     WHEN zone = 'zone5' THEN 19
//     WHEN zone = 'zone6' THEN 8
//     WHEN zone = 'zone7' THEN 16
//     WHEN zone = 'zone8' THEN 10
// 



//  UPDATE zone_visitors SET visitors = CASE 
//     WHEN zone = 'zone1' THEN 1
//     WHEN zone = 'zone2' THEN 13
//     WHEN zone = 'zone3' THEN 31
//     WHEN zone = 'zone4' THEN 155
//     WHEN zone = 'zone5' THEN 27
//     WHEN zone = 'zone6' THEN 0
//     WHEN zone = 'zone7' THEN 15
//     WHEN zone = 'zone8' THEN 9 END;
