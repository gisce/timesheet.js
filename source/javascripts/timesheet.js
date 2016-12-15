(function() {
    'use strict';

    /**
     * Initialize a Timesheet
     * @param container Id of the div where you have the timesheet
     * @param min First year you want to draw. Will always be drawn. If you send some data happening before that value it will be expanded in order to grab it too.
     * @param max Last year you want to draw. Will always be drawn. If you send some data happening after that value it will be expanded in order to grab it too.
     * @param fullWidth Full width of the div where you have the timesheet
     * @param dontDrawIf Number of years needed in order to stop drawing a part of the timesheet. -1 to always draw the compleate timesheet.
     * @param dateParse Element that separetes the date. The format must always be YYYY-MM-DD but you can use whatever you want insted of the '-'
     * @param data Data you want to representate in the timesheet
     */
    var Timesheet = function(container, min, max, fullWidth, dontDrawIf,  dateParse, data) {
        this.jumpSize= 11;

        this.dateParse= dateParse;
        this.dontDrawIf= dontDrawIf;

        this.data = [];

        this.neededYears= new MySet();
        this.neededYears.add(min);
        this.neededYears.add(max);

        this.year = {
            min: min,
            max: max
        };

        this.parse(data || []);

        this.numberOfJumps=0;
        var inJump=false;
        for (var i=this.year.min; i<this.year.max; i++){
            if (!inJump && !this.neededYears.contains(i)){
                inJump=true;
                this.numberOfJumps++;
            }
            else if (this.neededYears.contains(i))
                inJump=false;
        }

        this.fullWidth=fullWidth;

        this.widthYear=(fullWidth-this.numberOfJumps*this.jumpSize)/this.neededYears.size();

        if (typeof document !== 'undefined') {
            this.container = (typeof container === 'string') ? document.querySelector('#'+container) : container;

            this.drawSections();
            this.insertData();
        }
    };

    /**
     * Insert data into Timesheet
     */
    Timesheet.prototype.insertData = function() {
        var html = [];

        for (var n = 0, m = this.data.length; n < m; n++) {
            var cur = this.data[n];
            var bubble = this.createBubble(this.widthYear, this.year.min, cur.start, cur.end);

            var line = [
                '<span style="margin-left: ' + bubble.getStartOffset(this.neededYears, this.jumpSize) + 'px; width: ' + bubble.getWidth(this.neededYears, this.jumpSize) + 'px;" class="bubble bubble-' + (cur.type || 'default') + '" data-duration="' + (cur.end ? Math.round((cur.end - cur.start) / 1000 / 60 / 60 / 24 / 39) : '') + '"></span>',
                '<span class="label">' + cur.label + ' ' +
                    '<span class="date">' + bubble.getDateLabel() + '</span> ' +
                '</span>'
            ].join('');

            html.push('<li>' + line + '</li>');
        }

        this.container.innerHTML += '<ul class="data">' + html.join('') + '</ul>';
    };

    /**
     * Draw section labels
     */
    Timesheet.prototype.drawSections = function() {
        var html = [];
        var lastDrawn= true;

        for (var c = this.year.min; c <= this.year.max; c++) {
            if (this.neededYears.contains(c)) {
                html.push('<section style="width: ' + (this.widthYear - 1) + 'px" >' + c + '</section>');
                lastDrawn=true;
            }
            else if (lastDrawn) {
                lastDrawn=false;
                html.push('<section class="jump"></section>');
            }
        }

        this.container.className = 'timesheet color-scheme-default';
        this.container.innerHTML = '<div class="scale" style="width: ' + this.fullWidth + '">' + html.join('') + '<div class="years">' + '</div>' + '</div>';
    };

    /**
     * Parse data string
     */
    Timesheet.prototype.parseDate = function(date) {
        if (date.indexOf(this.dateParse) === -1) {
            date = new Date(parseInt(date, 10), 0, 1);
            date.hasMonth = false;
            date.hasDay = false;
        } else {
            date = date.split(this.dateParse);

            var dia;
            dia=1;
            if (date.length==3) {
                date = new Date(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10));
                date.hasDay = true;
            }
            else {
                date = new Date(parseInt(date[0], 10), parseInt(date[1], 10) - 1, 1);
                date.hasDay = false;
            }

            date.hasMonth = true;
        }

        return date;
    };

    /**
     * Parse passed data
     */
    Timesheet.prototype.parse = function(data) {
        for (var n = 0, m = data.length; n<m; n++) {
            var beg = this.parseDate(data[n][0]);
            var end = data[n].length === 4 ? this.parseDate(data[n][1]) : null;
            var lbl = data[n].length === 4 ? data[n][2] : data[n][1];
            var cat = data[n].length === 4 ? data[n][3] : data[n].length === 3 ? data[n][2] : 'default';

            if (beg.getFullYear() < this.year.min) {
                this.year.min = beg.getFullYear();
            }

            if (end && end.getFullYear() > this.year.max) {
                this.year.max = end.getFullYear();
            } else if (beg.getFullYear() > this.year.max) {
                this.year.max = beg.getFullYear();
            }

            if (end){
                if (this.dontDrawIf!=-1 && end.getFullYear()-beg.getFullYear()>= (this.dontDrawIf+1)) {
                    this.neededYears.add(end.getFullYear());
                    this.neededYears.add(beg.getFullYear());
                }
                else
                    for (var i=beg.getFullYear(); i<=end.getFullYear(); i++)
                        this.neededYears.add(i);
            }
            else
                this.neededYears.add(beg.getFullYear());


            this.data.push({start: beg, end: end, label: lbl, type: cat});
        }
    };

    /**
     * Wrapper for adding bubbles
     */
    Timesheet.prototype.createBubble = function(wMonth, min, start, end) {
        return new Bubble(wMonth, min, start, end);
    };

    /**
     * Timesheet Bubble
     */
    var Bubble = function(wMonth, min, start, end) {
        this.min = min;
        this.start = start;
        this.end = end;
        this.widthYear = wMonth;
    };

    /**
     * Format month number
     */
    Bubble.prototype.formatMonth = function(num) {
        num = parseInt(num, 10);

        return num >= 10 ? num : '0' + num;
    };

    /**
     * Calculate starting offset for bubble
     */
    Bubble.prototype.getStartOffset = function(neededYears, jumpSize) {
        return this.getDifferenceDates(new Date(this.min, 0, 1), this.start, neededYears, jumpSize);
    };

    /**
     * Get count of full years from start to end
     */
    Bubble.prototype.getFullYears = function() {
        return ((this.end && this.end.getFullYear()) || this.start.getFullYear()) - this.start.getFullYear();
    };

    /**
     * Get count of all months in Timesheet Bubble
     */
    Bubble.prototype.getMonths = function() {
        var fullYears = this.getFullYears();
        var months = 0;

        if (!this.end) {
            months += !this.start.hasMonth ? 12 : 1;
        } else {
            if (!this.end.hasMonth) {
                months += 12 - (this.start.hasMonth ? this.start.getMonth() : 0);
                months += 12 * (fullYears-1 > 0 ? fullYears-1 : 0);
            } else {
                months += this.end.getMonth() + 1;
                months += 12 - (this.start.hasMonth ? this.start.getMonth() : 0);
                months += 12 * (fullYears-1);
            }
        }

        return months;
    };

    /**
     * Get bubble's width in pixel
     */
    Bubble.prototype.getWidth = function(neededYears, jumpSize) {
        return this.getDifferenceDates(this.start, this.end, neededYears, jumpSize);
    };

    Bubble.prototype.getDifferenceDates = function(d1, d2, neededYears, jumpSize){
        var nJumpedYears = 0;
        var nJumps=0;
        var inJump=false;

        if (d2 && d2.getFullYear()) {
            for (var i = d1.getFullYear() + 1; i < d2.getFullYear(); i++) {
                if (neededYears.contains(i)) {
                    inJump=false;
                }
                else {
                    nJumpedYears++;
                    if (!inJump)
                        nJumps++;

                    inJump = true;
                }
            }
        }

        if (d2) {
            // We calculate the difference in years without counting the ones we don't draw
            var yearsDifference = (d2.getFullYear() - d1.getFullYear() - nJumpedYears);
            // We calculate the difference in months
            var monthDifference = d2.getMonth() - d1.getMonth();
            // We calculate the difference in days
            var daysDifference = d2.getDate() - d1.getDate();

            // Finally, we calculate the difference in time without taking the skipped years into account
            var timeDifference = ((daysDifference / 30) + monthDifference) / 12 + yearsDifference;

            // What we return is:
            // -> Multiplied by the width of a year, the sum of
            //      -> Difference in years (without the skipped years)
            //      -> Difference in months (converted to years)
            //      -> Difference in days (converted to years)
            // -> Multiplied by the width of a skip
            //      -> Number of skips done
            return (timeDifference * this.widthYear) + (nJumps * jumpSize);
        }
        else
            return (12-d1.getMonth()-(d1.getDate()/30))/12*this.widthYear+nJumps*jumpSize;
    };

    /**
     * Get the bubble's label
     */
    Bubble.prototype.getDateLabel = function() {
        var s="";
        
        if (this.start.hasDay)
            s+=this.formatMonth(this.start.getDate()) + '/';

        if (this.start.hasMonth)
            s+=this.formatMonth(this.start.getMonth() + 1) + '/';

        s+=this.start.getFullYear().toString().substr(2,2);

        if (this.end){
            s+= '-';

            if (this.end.hasDay)
                s+=this.formatMonth(this.end.getDate()) + '/';

            if (this.end.hasMonth)
                s+=this.formatMonth(this.end.getMonth() + 1) + '/';

            s+=this.end.getFullYear().toString().substr(2,2);
        }

        return s;
    };

    function MySet(){
        this.set=[];
    }

    MySet.prototype.contains = function (e) {
        for (var i=0; i<this.set.length; i++)
            if (this.set[i]==e)
                return true;

        return false;
    }

    MySet.prototype.add = function (e) {
        if (!this.contains(e))
            this.set.push(e);
    }

    MySet.prototype.size = function () {
        return this.set.length;
    }

    MySet.prototype.toString = function () {
        var s=" ";

        for (var i=0; i<this.set.length; i++)
            s+=this.set[i]+" ";

        return s;
    }

    window.Timesheet = Timesheet;
})();
