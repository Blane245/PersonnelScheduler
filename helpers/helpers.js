var express = require('express');
//some helper functions
// Availability - check all of the leaves to see if any of them overlap with the start and end dates
//TODO check other tasks that the person might be assigned to
exports.Availability = function(startDate, endDate, person, leaves, tasks) {

    var result = {available: true, reasons: []};

    // check scheduled leaves
    for (let i = 0; i < leaves.length; i++) {
        if (leaves[i].person == person) {
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

    return result;

}

// isQualified - for a person to be qualified, all of their role's equired training
// record must not expire before the end date of the task
exports.Qualification = function(endDate, role_trainings, person_trainings, person) {

    var result = {qualified: true, reasons: []};
    var nQuals = 0;
    // now check the person's training records against those required
    var rtTags = [];
    for (let irt = 0; irt < role_trainings.length; irt++) {
        rtTags.push(false);
        for (let ipt = 0; ipt < person_trainings.length; ipt++) {
            // skip if this training is not for the person being processed
            if ( role_trainings[irt].toString() == person_trainings[ipt].training.toString() && person.toString() == person_trainings[ipt].person.toString()) {
                if (person_trainings[ipt].expirationDate && person_trainings[ipt].expirationDate <= endDate){
                    result.reasons.push ("Training '"+person_trainings[ipt].training.name+
                        "' expires on "+person_trainings[ipt].expirationDate_formatted+
                        " pror to the task's start date");
                    result.qualified = false;

                } else
                    nQuals++;
                    rtTags[irt] = true;

            } else {
            }
        }
    }

    // check if any trainng records are missing
    for (let i = 0; i < role_trainings.length; i++){
        if (!rtTags[i]){
            result.reasons.push("Not all training is complete"); 
            result.qualified = false;
        }

    }

    // person must have all required training for a role
    if (nQuals == role_trainings.length)
        result.qualified = false;
    return result;
}
