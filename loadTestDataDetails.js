
function OrganizationLoad(cb) {async.series ([
    function (callback) {OrganizationCreate("organization1", "Organization with 1 job, 4 people, and 4 roles",  callback);},
    function (callback) {OrganizationCreate("organization2", "Organization with 2 jobs, 8 people, and 2 roles",  callback);},
    function (callback) {OrganizationCreate("organization3", "Organization with 3 jobs, 12 people, and 8 roles",  callback);},
    function (callback) {OrganizationCreate("organization4", "Organization with no children",  callback);},
    ],cb);}
function PersonLoad(cb) {async.series ([
    function (callback) {PersonCreate("lastName1", "firstName1", "email1@here.s1", organization[0],  callback);},
    function (callback) {PersonCreate("lastName2", "firstName2", "email1@here.s2", organization[0],  callback);},
    function (callback) {PersonCreate("lastName3", "firstName3", "email1@here.s3", organization[0],  callback);},
    function (callback) {PersonCreate("lastName4", "firstName4", "email1@here.s4", organization[0],  callback);},
    function (callback) {PersonCreate("lastName5", "firstName5", "email1@here.s5", organization[1],  callback);},
    function (callback) {PersonCreate("lastName6", "firstName6", "email1@here.s6", organization[1],  callback);},
    function (callback) {PersonCreate("lastName7", "firstName7", "email1@here.s7", organization[1],  callback);},
    function (callback) {PersonCreate("lastName8", "firstName8", "email1@here.s8", organization[1],  callback);},
    function (callback) {PersonCreate("lastName9", "firstName9", "email1@here.s9", organization[1],  callback);},
    function (callback) {PersonCreate("lastName10", "firstName10", "email1@here.s10", organization[1],  callback);},
    function (callback) {PersonCreate("lastName11", "firstName11", "email1@here.s11", organization[1],  callback);},
    function (callback) {PersonCreate("lastName12", "firstName12", "email1@here.s12", organization[1],  callback);},
    function (callback) {PersonCreate("lastName13", "firstName13", "email1@here.s13", organization[2],  callback);},
    function (callback) {PersonCreate("lastName14", "firstName14", "email1@here.s14", organization[2],  callback);},
    function (callback) {PersonCreate("lastName15", "firstName15", "email1@here.s15", organization[2],  callback);},
    function (callback) {PersonCreate("lastName16", "firstName16", "email1@here.s16", organization[2],  callback);},
    function (callback) {PersonCreate("lastName17", "firstName17", "email1@here.s17", organization[2],  callback);},
    function (callback) {PersonCreate("lastName18", "firstName18", "email1@here.s18", organization[2],  callback);},
    function (callback) {PersonCreate("lastName19", "firstName19", "email1@here.s19", organization[2],  callback);},
    function (callback) {PersonCreate("lastName20", "firstName20", "email1@here.s20", organization[2],  callback);},
    function (callback) {PersonCreate("lastName21", "firstName21", "email1@here.s21", organization[2],  callback);},
    function (callback) {PersonCreate("lastName22", "firstName22", "email1@here.s22", organization[2],  callback);},
    function (callback) {PersonCreate("lastName23", "firstName23", "email1@here.s23", organization[2],  callback);},
    function (callback) {PersonCreate("lastName24", "firstName24", "email1@here.s24", organization[2],  callback);},
    ],cb);}
function TrainingLoad(cb) {async.series ([
    function (callback) {TrainingCreate("training1", "training used by roles 1-4",  callback);},
    function (callback) {TrainingCreate("training2", "training used by roles 2-4",  callback);},
    function (callback) {TrainingCreate("training3", "training used by roles 3-4",  callback);},
    function (callback) {TrainingCreate("training4", "training used by role 4",  callback);},
    function (callback) {TrainingCreate("training5", "training used by role6",  callback);},
    function (callback) {TrainingCreate("training6", "training used by roles 5-6",  callback);},
    function (callback) {TrainingCreate("training7", "training used by roles 7-13",  callback);},
    ],cb);}
function RoleLoad(cb) {async.series ([
    function (callback) {RoleCreate("role1", "role with 1 training requirement", organization[0], [training[0]],  callback);},
    function (callback) {RoleCreate("role2", "role with 2 training requirement", organization[0], [training[0], training[1]],  callback);},
    function (callback) {RoleCreate("role3", "role with 3 training requirement", organization[0], [training[0], training[1], training[2]],  callback);},
    function (callback) {RoleCreate("role4", "role with 4 training requirement", organization[0], [training[0], training[1], training[2], training[3]],  callback);},
    function (callback) {RoleCreate("role5", "role with 1 training requirement", organization[1], [training[4]],  callback);},
    function (callback) {RoleCreate("role6", "role with 2 training requirement", organization[1], [training[4], training[5]],  callback);},
    function (callback) {RoleCreate("role7", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role8", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role9", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role10", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role11", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role12", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role13", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    function (callback) {RoleCreate("role14", "role with 1 training requirement", organization[2], [training[6]],  callback);},
    ],cb);}
function JobLoad(cb) {async.series ([
    function (callback) {JobCreate("Job1", "job with 4 roles", organization[0], [role[0], role[1], role[2], role[3]],  callback);},
    function (callback) {JobCreate("Job2", "job with 2 roles", organization[1], [role[4], role[5]],  callback);},
    function (callback) {JobCreate("Job3", "job with 2 roles", organization[1], [role[4], role[5]],  callback);},
    function (callback) {JobCreate("Job4", "job with 4 roles", organization[2], [role[6], role[7], role[8], role[9]],  callback);},
    function (callback) {JobCreate("Job5", "job with 4 roles", organization[2], [role[6], role[7], role[8], role[9]],  callback);},
    function (callback) {JobCreate("Job6", "job with 8 roles", organization[2], [role[6], role[7], role[8], role[9], role[10], role[11], role[12], role[13]],  callback);},
    ],cb);}
function Person_TrainingLoad(cb) {async.series ([
    function (callback) {Person_TrainingCreate(person[0], training[0], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[1], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[2], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[3], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[4], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[5], false,  callback);},
    function (callback) {Person_TrainingCreate(person[0], training[6], false,  callback);},
    ],cb);}
function TaskLoad(cb) {async.series ([
    function (callback) {TaskCreate("Task1", "Task 1 for job 1", "1/1/2022", "1/1/2022", job[0], [role[0], role[1], role[2], role[3]],  callback);},
    ],cb);}
function LeaveLoad(cb) {async.series ([
    function (callback) {LeaveCreate("leave1", "1/1/2022", "1/7/2022", person[0],  callback);},
    function (callback) {LeaveCreate("leave2", "1/2/2022", "1/8/2022", person[1],  callback);},
    function (callback) {LeaveCreate("leave3", "1/3/2022", "1/9/2022", person[2],  callback);},
    function (callback) {LeaveCreate("leave4", "1/4/2022", "1/10/2022", person[3],  callback);},
    function (callback) {LeaveCreate("leave5", "1/5/2022", "1/11/2022", person[4],  callback);},
    function (callback) {LeaveCreate("leave6", "1/6/2022", "1/12/2022", person[5],  callback);},
    function (callback) {LeaveCreate("leave7", "1/7/2022", "1/13/2022", person[6],  callback);},
    ],cb);}
