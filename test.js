const misc = require('./js/misc.js');

let int = [ [0, 65], [250, 310] ];

// case 1: u is completely outside all intervals
let case1 = [ [75, 150] ];
let expected1 = [ [0, 65], [75, 150], [ 250, 310] ];
console.log(`\nTest 1: u is completely outside all intervals\n\n${JSON.stringify(case1)} U ${JSON.stringify(int)} = ${JSON.stringify(union_intervals(int, case1))}\nExpected: ${JSON.stringify(expected1)}`);

// case 2: u is completely contained within an interval
let case2 = [ [275, 300] ];
let expected2 = [ [0, 65], [250, 310] ];
console.log(`\nTest 2: u is completely contained within an interval\n\n${JSON.stringify(case2)} U ${JSON.stringify(int)} = ${JSON.stringify(union_intervals(int, case2))}\nExpected: ${JSON.stringify(expected2)}`);

// case 3: u completely contains an interval
let case3 = [ [100, 400] ];
let expected3 = [ [0, 65], [100, 400] ];
console.log(`\nTest 3: u completely contains an interval\n\n${JSON.stringify(case3)} U ${JSON.stringify(int)} = ${JSON.stringify(union_intervals(int, case3))}\nExpected: ${JSON.stringify(expected3)}`);

// case 4: u contains a lower bound
let case4 = [ [100, 300] ];
let expected4 = [ [0, 65], [100, 310] ];

// case 5: u contains an upper bound
let case5 = [ [300, 400] ];
let expected5 = [ [0, 65], [250, 400] ];

// case 6: u spans the start and end of two intervals
let case6 = [ [50, 300] ];
let expected6 = [ [0, 400] ];


function union_intervals(int1, int2) {

    // int1 and int2 are passed by reference so make a copy
    int1 = JSON.parse(JSON.stringify(int1));
    int2 = JSON.parse(JSON.stringify(int2));

    // check each interval within int2
    for (let u of int2) {

        // case 1: u is completely outside all intervals in int1
        let outside_count = 0;
        for (let int of int1) {
            let [u_start, u_end] = u;
            let [int_start, int_end] = int;
            if ( ((u_start < int_start) && (u_end < int_start)) || ((u_start > int_end) && (u_end > int_end)) ) {
                outside_count++;
            }
        }
        if (outside_count === int1.length) {
            int1.push(u);
            break;
        }

        // case 2: u is completely contained wihtin an interval of int1
        for (let int of int1) {
            let [u_start, u_end] = u;
            if (misc.in_interval(u_start, int) && misc.in_interval(u_end, int)) {
                break;
            }
        }

        // case 3: u completely contains an interval
        for (let int of int1) {
            let [u_start, u_end] = u;
            let [int_start, int_end] = int;
            if ((u_start <= int_start) && (u_end >= int_end)) {
                let index = int1.indexOf(int);
                int1.splice(index, 1, u);
            }
        }

    }

    return misc.sort_intervals(int1);

}