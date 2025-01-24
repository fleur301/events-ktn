import { parseISO, isEqual, isBefore, isAfter, eachDayOfInterval, format } from "date-fns";

/** ADDRESS
 * name, StreetAddress
 * PostalCode, addressLocality
 */
export function buildAddressObject(_event) {
    let location = _event.location[0];
    return location
        ? {
            name: location.address?.name,
            street: location.address?.streetAddress,
            zipCode: location.address?.postalCode,
            locality: location.address?.addressLocality,
            geo_long: location.geo?.longitude,
            geo_lat: location.geo?.latitude,
        }
        : null;
}

export function buildImagesObject(_event) {
    let images = [];
    _event.image.forEach((img) => {
        images.push({
            url: img['dc:webUrl'],
            name: img.name,
            copyright: img.copyrightNotice,
        });
    });

    return images;
}


/**
 * Event does never end?
 * Case 1: Startdate and no endDate (maybe also no endTime)
 * Event on one day:
 * Case 2: Starddate and endDate + Times -> Startdate = Enddate.
 * Multiple Days:
 * Case 3: Startdate and endDate + Times.
 */
export function buildSchedule(_event) {
    let schedules = _event.eventSchedule;
    let eventSchedule = [];

    schedules?.forEach((curSchedule) => {
        let now = new Date();
        let today = format(now, 'yyyy-MM-dd');
        let startTime = curSchedule.startTime;
        let endTime = curSchedule.endTime;

        //Fallbacks, in case start or enddate are not set correct
        let startDate = curSchedule.startDate ? format(curSchedule.startDate, 'yyyy-MM-dd') : _event.startDate ? format(_event.startDate, 'yyyy-MM-dd') : null;
        let endDate = curSchedule.endDate ? format(curSchedule.endDate, 'yyyy-MM-dd') : _event.endDate ? format(_event.endDate, 'yyyy-MM-dd') : today;

        if (isEqual(startDate, endDate)) {
            let eventEndTime = new Date(`${endDate}T${endTime}`);

            if (isAfter(eventEndTime, now)) {
                //create "useful" timestamps for eventstart and end
                let eventStart = new Date(`${startDate}T${startTime}`);
                eventSchedule.push({
                    startDate: format(startDate, "dd.MM.yyyy"),
                    startTime: startTime,
                    endTime: endTime != startTime ? endTime : startTime,
                    eventStart: eventStart,
                });
            }
        } else {

            //if interval is already in the past - skip
            if (isBefore(startDate, today) && isBefore(endDate, today)) {
                return;
            }

            //Map the byDay to JS Weekday Format
            let intervalStart = isBefore(startDate, today) ? today : (startDate);

            let excludedDates = curSchedule.excludedDates;

            //Get byDays in JS Format
            let weekDays = curSchedule.byDay?.map((dayUrl) => {
                let day = dayUrl.split("/").pop();
                return [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ].indexOf(day);
            });


            let allDates = eachDayOfInterval({
                start: intervalStart,
                end: endDate,
            }).filter((currentDate) => {

                let currentDay = currentDate.getDay();
                //toISOString converts TS to zulu-ts, so we use format instead 
                let formattedDate = format(currentDate, "yyyy-MM-dd");
                let formattedNow = format(now, "yyyy-MM-dd");

                //Include only given weekdays and exclude "excluded Days"
                let isWeekDayIncluded = weekDays ? weekDays.includes(currentDay) : true;
                let isNotExcluded = excludedDates ? !excludedDates.includes(formattedDate) : true;

                //only include if not already expired today
                let isEventNotExpired = true;
                if (isEqual(formattedDate, formattedNow)) {
                    let eventEndTime = new Date(`${formattedDate}T${endTime}`);
                    if (isAfter(now, eventEndTime)) {
                        isEventNotExpired = false;
                    }
                }

                return isWeekDayIncluded && isNotExcluded && isEventNotExpired;
            });

            allDates.forEach((currentDate) => {
                eventSchedule.push({
                    startDate: format(currentDate, "dd.MM.yyyy"),
                    startTime: startTime,
                    endTime: endTime != startTime ? endTime : null,
                    eventStart: currentDate,
                    eventEnd: currentDate,
                });
            });
        }
    });

    eventSchedule.sort((a, b) => a.eventStart - b.eventStart);
    return eventSchedule;
}
