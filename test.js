const misc = require('./js/misc.js');

let int = [ [0, 65], [250, 310] ];

// case 1: u is completely outside all intervals
let case1 = [ [75, 150] ];
let expected1 = [ [0, 65], [75, 150], [ 250, 310] ];
console.log(`\nTest 1: u is completely outside all intervals\n\n
            ${JSON.stringify(case1)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case1))}\n
            Expected: ${JSON.stringify(expected1)}`);

// case 2: u is completely contained within an interval
let case2 = [ [275, 300] ];
let expected2 = [ [0, 65], [250, 310] ];
console.log(`\nTest 2: u is completely contained within an interval\n\n
            ${JSON.stringify(case2)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case2))}\n
            Expected: ${JSON.stringify(expected2)}`);

// case 3: u completely contains an interval
let case3 = [ [100, 400] ];
let expected3 = [ [0, 65], [100, 400] ];
console.log(`\nTest 3: u completely contains an interval\n\n
            ${JSON.stringify(case3)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case3))}\n
            Expected: ${JSON.stringify(expected3)}`);

// case 4: u contains a lower bound
let case4 = [ [100, 300] ];
let expected4 = [ [0, 65], [100, 310] ];
console.log(`\nTest 4: u contains a lower bound\n\n
            ${JSON.stringify(case4)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case4))}\n
            Expected: ${JSON.stringify(expected4)}`);

// case 5: u contains an upper bound
let case5 = [ [300, 400] ];
let expected5 = [ [0, 65], [250, 400] ];
console.log(`\nTest 5: u contains a upper bound\n\n
            ${JSON.stringify(case5)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case5))}\n
            Expected: ${JSON.stringify(expected5)}`);

// case 6: u spans the start and end of two intervals
let case6 = [ [50, 300] ];
let expected6 = [ [0, 310] ];
console.log(`\nTest 6: u spans the start and end of two intervals\n\n
            ${JSON.stringify(case6)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, case6))}\n
            Expected: ${JSON.stringify(expected6)}`);

//let int = [ [0, 65], [250, 310] ];
let test = [ [10, 25], [40, 70], [72, 90], [100, 200], [300, 500], [700, 800] ];
let expected = [ [0, 90], [100, 200], [250, 500], [700, 800] ];
console.log(`\nTest 7: combining multiple intervals\n\n
            ${JSON.stringify(test)} U ${JSON.stringify(int)} = 
            ${JSON.stringify(misc.union_intervals(int, test))}\n
            Expected: ${JSON.stringify(expected)}`);
