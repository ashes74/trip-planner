'use strict';
/* global $ */

/**
 * A module for managing multiple days & application state.
 * Days are held in a `days` array, with a reference to the `currentDay`.
 * Clicking the "add" (+) button builds a new day object (see `day.js`)
 * and switches to displaying it. Clicking the "remove" button (x) performs
 * the relatively involved logic of reassigning all day numbers and splicing
 * the day out of the collection.
 *
 * This module has four public methods: `.load()`, which currently just
 * adds a single day (assuming a priori no days); `switchTo`, which manages
 * hiding and showing the proper days; and `addToCurrent`/`removeFromCurrent`,
 * which take `attraction` objects and pass them to `currentDay`.
 */

var daysModule = (function () {

  // application state

  var days = [],
      currentDay;

  // jQuery selections

  var $addButton, $removeButton;
  $(function () {
    $addButton = $('#day-add');
    $removeButton = $('#day-title > button.remove');
  });

  // method used both internally and externally

  function switchTo (newCurrentDay) {
    if (currentDay) currentDay.hide();
    currentDay = newCurrentDay;
    currentDay.show();
  }

  // jQuery event binding

  $(function () {
    $addButton.on('click', addDay);
    $removeButton.on('click', deleteCurrentDay);
  });

  function addDay () {
    if (this && this.blur) this.blur(); // removes focus box from buttons
    $.post('/api/days')
    .done(function (dbDay) {
      var newDay = dayModule.create(dbDay);
      days.push(newDay);
      if (days.length === 1) {
        currentDay = newDay;
        switchTo(currentDay);
      }
    })
    .fail(console.error.bind(console));
  }

  function deleteCurrentDay () {
    // prevent deleting last day
    if (days.length < 2 || !currentDay) return;
    // remove from the collection
    $.ajax({
      method: 'DELETE',
      url: '/api/days/' + currentDay.id,
      success: function () {
        var index = days.indexOf(currentDay),
          previousDay = days.splice(index, 1)[0],
          newCurrent = days[index] || days[index - 1];
        // fix the remaining day numbers
        days.forEach(function (day, i) {
          day.setNumber(i + 1);
        });
        switchTo(newCurrent);
        previousDay.hideButton();
      },
      error: console.error.bind(console)
    });
  }

  // globally accessible module methods

  var methods = {

    load: function () {
      $.get('/api/days')
      .done(function (dbDays) {
        dbDays.forEach(function (dbDay) {
          days.push(dayModule.create(dbDay));
        });
        if (!days.length) addDay();
        else switchTo(days[0]);
      })
      .fail(console.error.bind(console));
    },

    switchTo: switchTo,

    addToCurrent: function (attraction) {
      currentDay.addAttraction(attraction);
    },

    removeFromCurrent: function (attraction) {
      currentDay.removeAttraction(attraction);
    }

  };

  return methods;

}());
