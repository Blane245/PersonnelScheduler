    calendar.render();
    calendar.on('dateClick', function (info) {dateClick(info)});
    calendar.on('eventClick', function (info) {
      alert(calendar.formatRange(info.el.fcSeg.eventRange.range.start, info.el.fcSeg.eventRange.range.end,
          {year: '2-digit', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          hour12:'false', 
          separator: ' to ' }));
    });
    calendar.on('datesSet', function (dateInfo) {
        updateDetails (dateInfo);});

    // remove the trash that pug leaves behind
    theEnd = document.lastChild();
    theEnd.remove();
});
