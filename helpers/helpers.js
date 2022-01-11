var express = require('express');
//some helper functions
// Availability - check all of the leaves to see if any of them overlap with the start and end dates
//TODO check other tasks that the person might be assigned to
exports.Availability = function(startDate, endDate, taskId, personId, leaves, tasks) {

    var result = {available: true, reasons: []};

    // check scheduled leaves
    for (let i = 0; i < leaves.length; i++) {
        if (leaves[i].person == personId) {
            if (leaves[i].startDate_formatted <= endDate && leaves[i].endDate && leaves[i].endDate_formatted > startDate) {
                result.available = false;
                result.reasons.push(
                    "Leave '"+leaves[i].name+ "': " + leaves[i].startDate_formatted + " - " + leaves[i].endDate_formatted + " overlaps with task");
            }
            if (leaves[i].startDate_formatted <= endDate && !leaves[i].endDate) {
                result.available = false;
                result.reasons.push(
                    "Person has indefinate leave '"+leaves[i].name+ "' starting " + leaves[i].startDate_formatted);
            }
        };
    }

    // check other scehduled tasks
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id != taskId) {
            if ((tasks[i].startDate < startDate && tasks[i].endDate > startDate) ||
                (tasks[i].startdate >= startDate && tasks[i].startDate <= endDate)) {
                result.available = false;
                result.reasons.push(
                    "Person is working task '" + tasks[i].name + "' which overlaps with this task"
                );
            }
        }
    }

    return result;

}

// isQualified - for a person to be qualified, all of their role's required training
// record must not expire before the end date of the task
exports.Qualification = function(endDate, role_trainings, person_trainings, person) {

    var result = {qualified: true, reasons: []};
    // now check the person's training records against those required
    var rtTags = [];
    rtTags.length = role_trainings.length;
    for (let irt = 0; irt < role_trainings.length; irt++) {
        const role_training = role_trainings[irt];
        rtTags[irt] = false;
        for (let ipt = 0; ipt < person_trainings.length; ipt++) {
            const person_training = person_trainings[ipt];
            // skip if this training is not for the person being processed
            if (role_training._id.toString() == person_training.training._id.toString() && 
                person.toString() == person_training.person._id.toString()) {
                console.log('in qualification, training match: role training' + role_training.name + ' person: ' + person.toString());
                if (person_training.expirationDate && person_training.expirationDate <= endDate){
                    result.reasons.push ("Training '"+person_training.training.name+
                        "' expires on "+person_training.expirationDate_formatted+
                        " pror to the task's start date");
                    result.qualified = false;
                } else
                    rtTags[irt] = true;
            }
        }
    }

    // check if any trainng records are missing
    for (let i = 0; i < role_trainings.length; i++){
        if (!rtTags[i]){
            result.reasons.push("No training records for '" + role_trainings[i].name + "'"); 
            result.qualified = false;
        }

    }

    return result;
}
