/*
= GET WINDOW WIDTH
------------------------------------------------------------------------------------- */

function viewport() {
  var e = window,
    a = "inner";
  if (!("innerWidth" in window)) {
    a = "client";
    e = document.documentElement || document.body;
  }
  return { width: e[a + "Width"] };
}

/*
= DEFINE JS EASING
------------------------------------------------------------------------------------- */

jQuery.extend(jQuery.easing, {
  def: "easeOutQuad",
  easeOutCubic: function (x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  },
  easeInOutCubic: function (x, t, b, c, d) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t + b;
    return (c / 2) * ((t -= 2) * t * t + 2) + b;
  },
});

/*
= SPLIT TEXT INTO COLUMNS
------------------------------------------------------------------------------------- */

(function ($) {
  var DATA_ORIGINAL_DOM_KEY = "columnizer-original-dom";

  $.fn.columnize = function (options) {
    this.each(function () {
      var $el = $(this);
      $el.data(DATA_ORIGINAL_DOM_KEY, $el.clone(true, true));
    });

    this.cols = [];
    this.offset = 0;
    this.before = [];
    this.lastOther = 0;
    this.prevMax = 0;
    this.debug = 0;
    this.setColumnStart = null;
    this.elipsisText = "";

    var defaults = {
      width: 400,
      columns: 2,
      buildOnce: false,
      overflow: false,
      doneFunc: function () {},
      target: false,
      ignoreImageLoading: true,
      columnFloat: "left",
      lastNeverTallest: true,
      accuracy: 1,
      precise: false,
      manualBreaks: false,
      disableSingle: false,
      cssClassPrefix: "",
      elipsisText: "...",
      debug: 0,
    };
    options = $.extend(defaults, options);

    var tables = new Array();

    $("table").each(function () {
      if (!$(this).hasClass("tableSaved")) {
        $(this).addClass("tableSaved");
        $(this).addClass("tableID-" + tables.length);
        tables.push({
          tableID: "tableID-" + tables.length,
          thead: $(this).find("thead:first").clone(),
          tfoot: $(this).find("tfoot:first").clone(),
        });
      }
    });

    function fixTables($pullOutHere) {
      for (i = 0; i < tables.length; i++) {
        if ($pullOutHere.is("table")) {
          if (
            $pullOutHere.children("tfoot").length == 0 &&
            $pullOutHere.hasClass(tables[i].tableID)
          ) {
            $(tables[i].tfoot).clone().prependTo($pullOutHere);
          }
          if (
            $pullOutHere.children("thead").length == 0 &&
            $pullOutHere.hasClass(tables[i].tableID)
          ) {
            $(tables[i].thead).clone().prependTo($pullOutHere);
          }
        }
        $pullOutHere.find("table ." + tables[i].tableID).each(function () {
          if ($(this).children("tfoot").length == 0) {
            $(tables[i].tfoot).clone().prependTo(this);
          }
          if ($(this).children("thead").length == 0) {
            $(tables[i].thead).clone().prependTo(this);
          }
        });
      }
    }

    if (typeof options.width == "string") {
      options.width = parseInt(options.width, 10);
      if (isNaN(options.width)) {
        options.width = defaults.width;
      }
    }
    if (typeof options.setColumnStart == "function") {
      this.setColumnStart = options.setColumnStart;
    }
    if (typeof options.elipsisText == "string") {
      this.elipsisText = options.elipsisText;
    }
    if (options.debug) {
      this.debug = options.debug;
    }
    if (!options.setWidth) {
      if (options.precise) {
        options.setWidth = function (numCols) {
          return 100 / numCols;
        };
      } else {
        options.setWidth = function (numCols) {
          return Math.floor(100 / numCols);
        };
      }
    }

    function appendSafe($target, $elem) {
      try {
        $target.append($elem);
      } catch (e) {
        $target[0].appendChild($elem[0]);
      }
    }

    return this.each(function () {
      var $inBox = options.target ? $(options.target) : $(this);
      var maxHeight = $(this).height();
      var $cache = $("<div></div>");
      var lastWidth = 0;
      var columnizing = false;
      var manualBreaks = options.manualBreaks;
      var cssClassPrefix = defaults.cssClassPrefix;
      if (typeof options.cssClassPrefix == "string") {
        cssClassPrefix = options.cssClassPrefix;
      }

      var adjustment = 0;

      appendSafe($cache, $(this).contents().clone(true));

      if (!options.ignoreImageLoading && !options.target) {
        if (!$inBox.data("imageLoaded")) {
          $inBox.data("imageLoaded", true);
          if ($(this).find("img").length > 0) {
            var func = (function ($inBox, $cache) {
              return function () {
                if (!$inBox.data("firstImageLoaded")) {
                  $inBox.data("firstImageLoaded", "true");
                  appendSafe($inBox.empty(), $cache.children().clone(true));
                  $inBox.columnize(options);
                }
              };
            })($(this), $cache);
            $(this).find("img").one("load", func);
            $(this).find("img").one("abort", func);
            return;
          }
        }
      }

      $inBox.empty();

      columnizeIt();

      if (!options.buildOnce) {
        $(window).on("resize", function () {
          if (!options.buildOnce) {
            if ($inBox.data("timeout")) {
              clearTimeout($inBox.data("timeout"));
            }
            $inBox.data("timeout", setTimeout(columnizeIt, 1500));
          }
        });
      }

      function prefixTheClassName(className, withDot) {
        var dot = withDot ? "." : "";
        if (cssClassPrefix.length) {
          return dot + cssClassPrefix + "-" + className;
        }
        return dot + className;
      }

      function columnize(
        $putInHere,
        $pullOutHere,
        $parentColumn,
        targetHeight
      ) {
        while (
          (manualBreaks || $parentColumn.height() < targetHeight) &&
          $pullOutHere[0].childNodes.length
        ) {
          var node = $pullOutHere[0].childNodes[0];
          if ($(node).find(prefixTheClassName("columnbreak", true)).length) {
            return;
          }
          if ($(node).hasClass(prefixTheClassName("columnbreak"))) {
            return;
          }

          appendSafe($putInHere, $(node));
        }
        if ($putInHere[0].childNodes.length === 0) return;

        var kids = $putInHere[0].childNodes;
        var lastKid = kids[kids.length - 1];
        $putInHere[0].removeChild(lastKid);
        var $item = $(lastKid);

        if ($item[0].nodeType == 3) {
          var oText = $item[0].nodeValue;
          var counter2 = options.width / 18;
          if (options.accuracy) counter2 = options.accuracy;
          var columnText;
          var latestTextNode = null;
          while ($parentColumn.height() < targetHeight && oText.length) {
            var indexOfSpace = oText.indexOf(" ", counter2);
            if (indexOfSpace != -1) {
              columnText = oText.substring(0, indexOfSpace);
            } else {
              columnText = oText;
            }
            latestTextNode = document.createTextNode(columnText);
            appendSafe($putInHere, $(latestTextNode));

            if (oText.length > counter2 && indexOfSpace != -1) {
              oText = oText.substring(indexOfSpace);
            } else {
              oText = "";
            }
          }
          if (
            $parentColumn.height() >= targetHeight &&
            latestTextNode !== null
          ) {
            $putInHere[0].removeChild(latestTextNode);
            oText = latestTextNode.nodeValue + oText;
          }
          if (oText.length) {
            $item[0].nodeValue = oText;
          } else {
            return false;
          }
        }

        if ($pullOutHere.contents().length) {
          $pullOutHere.prepend($item);
        } else {
          appendSafe($pullOutHere, $item);
        }

        return $item[0].nodeType == 3;
      }

      function split($putInHere, $pullOutHere, $parentColumn, targetHeight) {
        if (
          $putInHere
            .contents(":last")
            .find(prefixTheClassName("columnbreak", true)).length
        ) {
          fixTables($pullOutHere);
          return;
        }
        if (
          $putInHere
            .contents(":last")
            .hasClass(prefixTheClassName("columnbreak"))
        ) {
          fixTables($pullOutHere);
          return;
        }
        if ($pullOutHere.contents().length) {
          var $cloneMe = $pullOutHere.contents(":first");
          if (
            typeof $cloneMe.get(0) == "undefined" ||
            $cloneMe.get(0).nodeType != 1
          )
            return;
          var $clone = $cloneMe.clone(true);
          if ($cloneMe.hasClass(prefixTheClassName("columnbreak"))) {
            appendSafe($putInHere, $clone);
            $cloneMe.remove();
          } else if (manualBreaks) {
            appendSafe($putInHere, $clone);
            $cloneMe.remove();
          } else if (
            $clone.get(0).nodeType == 1 &&
            !$clone.hasClass(prefixTheClassName("dontend"))
          ) {
            appendSafe($putInHere, $clone);
            if (
              $clone.is("img") &&
              $parentColumn.height() < targetHeight + 20
            ) {
              $cloneMe.remove();
            } else if (
              $cloneMe.hasClass(prefixTheClassName("dontsplit")) &&
              $parentColumn.height() < targetHeight + 20
            ) {
              $cloneMe.remove();
            } else if (
              $clone.is("img") ||
              $cloneMe.hasClass(prefixTheClassName("dontsplit"))
            ) {
              $clone.remove();
            } else {
              $clone.empty();
              if (!columnize($clone, $cloneMe, $parentColumn, targetHeight)) {
                $cloneMe.addClass(prefixTheClassName("split"));
                if ($cloneMe.get(0).tagName == "OL") {
                  var startWith =
                    $clone.get(0).childElementCount + $clone.get(0).start;
                  $cloneMe.attr("start", startWith + 1);
                }

                if ($cloneMe.children().length) {
                  split($clone, $cloneMe, $parentColumn, targetHeight);
                }
              } else {
                $cloneMe.addClass(prefixTheClassName("split"));
              }
              if ($clone.get(0).childNodes.length === 0) {
                $clone.remove();
                $cloneMe.removeClass(prefixTheClassName("split"));
              } else if ($clone.get(0).childNodes.length == 1) {
                var onlyNode = $clone.get(0).childNodes[0];
                if (onlyNode.nodeType == 3) {
                  var nonwhitespace = /\S/;
                  var str = onlyNode.nodeValue;
                  if (!nonwhitespace.test(str)) {
                    $clone.remove();
                    $cloneMe.removeClass(prefixTheClassName("split"));
                  }
                }
              }
            }
          }
        }
        fixTables($pullOutHere);
      }

      function singleColumnizeIt() {
        if ($inBox.data("columnized") && $inBox.children().length == 1) {
          return;
        }
        $inBox.data("columnized", true);
        $inBox.data("columnizing", true);

        $inBox.empty();
        $inBox.append(
          $(
            "<div class='" +
              prefixTheClassName("first") +
              " " +
              prefixTheClassName("last") +
              " " +
              prefixTheClassName("column") +
              " " +
              "' style='width:100%; float: " +
              options.columnFloat +
              ";'></div>"
          )
        );
        $col = $inBox.children().eq($inBox.children().length - 1);
        $destroyable = $cache.clone(true);
        if (options.overflow) {
          targetHeight = options.overflow.height;
          columnize($col, $destroyable, $col, targetHeight);
          if (
            !$destroyable
              .contents()
              .find(":first-child")
              .hasClass(prefixTheClassName("dontend"))
          ) {
            split($col, $destroyable, $col, targetHeight);
          }

          while (
            $col.contents(":last").length &&
            checkDontEndColumn($col.contents(":last").get(0))
          ) {
            var $lastKid = $col.contents(":last");
            $lastKid.remove();
            $destroyable.prepend($lastKid);
          }

          var html = "";
          var div = document.createElement("DIV");
          while ($destroyable[0].childNodes.length > 0) {
            var kid = $destroyable[0].childNodes[0];
            if (kid.attributes) {
              for (var i = 0; i < kid.attributes.length; i++) {
                if (kid.attributes[i].nodeName.indexOf("jQuery") === 0) {
                  kid.removeAttribute(kid.attributes[i].nodeName);
                }
              }
            }
            div.innerHTML = "";
            div.appendChild($destroyable[0].childNodes[0]);
            html += div.innerHTML;
          }
          var overflow = $(options.overflow.id)[0];
          overflow.innerHTML = html;
        } else {
          appendSafe($col, $destroyable.contents());
        }
        $inBox.data("columnizing", false);

        if (options.overflow && options.overflow.doneFunc) {
          options.overflow.doneFunc();
        }
        options.doneFunc();
      }

      function checkDontEndColumn(dom) {
        if (dom.nodeType == 3) {
          if (/^\s+$/.test(dom.nodeValue)) {
            if (!dom.previousSibling) return false;
            return checkDontEndColumn(dom.previousSibling);
          }
          return false;
        }
        if (dom.nodeType != 1) return false;
        if ($(dom).hasClass(prefixTheClassName("dontend"))) return true;
        if (dom.childNodes.length === 0) return false;
        return checkDontEndColumn(dom.childNodes[dom.childNodes.length - 1]);
      }

      function columnizeIt() {
        adjustment = 0;
        if (lastWidth == $inBox.width()) return;
        lastWidth = $inBox.width();

        var numCols = Math.round($inBox.width() / options.width);
        var optionWidth = options.width;
        var optionHeight = options.height;
        if (options.columns) numCols = options.columns;
        if (manualBreaks) {
          numCols =
            $cache.find(prefixTheClassName("columnbreak", true)).length + 1;
          optionWidth = false;
        }

        if (numCols <= 1 && !options.disableSingle) {
          return singleColumnizeIt();
        }
        if ($inBox.data("columnizing")) return;
        $inBox.data("columnized", true);
        $inBox.data("columnizing", true);

        $inBox.empty();
        $inBox.append(
          $(
            "<div style='width:" +
              options.setWidth(numCols) +
              "%; float: " +
              options.columnFloat +
              ";'></div>"
          )
        );
        $col = $inBox.children(":last");
        appendSafe($col, $cache.clone());
        maxHeight = $col.height();
        $inBox.empty();

        var targetHeight = maxHeight / numCols;
        var firstTime = true;
        var maxLoops = 3;
        var scrollHorizontally = false;
        if (options.overflow) {
          maxLoops = 1;
          targetHeight = options.overflow.height;
        } else if (optionHeight && optionWidth) {
          maxLoops = 1;
          targetHeight = optionHeight;
          scrollHorizontally = true;
        }

        for (
          var loopCount = 0;
          loopCount < maxLoops && loopCount < 20;
          loopCount++
        ) {
          $inBox.empty();
          var $destroyable, className, $col, $lastKid;
          try {
            $destroyable = $cache.clone(true);
          } catch (e) {
            $destroyable = $cache.clone();
          }
          $destroyable.css("visibility", "hidden");
          for (var i = 0; i < numCols; i++) {
            className = i === 0 ? prefixTheClassName("first") : "";
            className += " " + prefixTheClassName("column");
            className =
              i == numCols - 1
                ? prefixTheClassName("last") + " " + className
                : className;
            $inBox.append(
              $(
                "<div class='" +
                  className +
                  "' style='width:" +
                  options.setWidth(numCols) +
                  "%; float: " +
                  options.columnFloat +
                  ";'></div>"
              )
            );
          }

          i = 0;
          while (
            i < numCols - (options.overflow ? 0 : 1) ||
            (scrollHorizontally && $destroyable.contents().length)
          ) {
            if ($inBox.children().length <= i) {
              $inBox.append(
                $(
                  "<div class='" +
                    className +
                    "' style='width:" +
                    options.setWidth(numCols) +
                    "%; float: " +
                    options.columnFloat +
                    ";'></div>"
                )
              );
            }
            $col = $inBox.children().eq(i);
            if (scrollHorizontally) {
              $col.width(optionWidth + "px");
            }
            columnize($col, $destroyable, $col, targetHeight);
            split($col, $destroyable, $col, targetHeight);

            while (
              $col.contents(":last").length &&
              checkDontEndColumn($col.contents(":last").get(0))
            ) {
              $lastKid = $col.contents(":last");
              $lastKid.remove();
              $destroyable.prepend($lastKid);
            }
            i++;

            if (
              $col.contents().length === 0 &&
              $destroyable.contents().length
            ) {
              $col.append($destroyable.contents(":first"));
            } else if (
              i == numCols - (options.overflow ? 0 : 1) &&
              !options.overflow
            ) {
              if (
                $destroyable.find(prefixTheClassName("columnbreak", true))
                  .length
              ) {
                numCols++;
              }
            }
          }
          if (options.overflow && !scrollHorizontally) {
            var IE6 = false;
            var IE7 =
              document.all && navigator.appVersion.indexOf("MSIE 7.") != -1;
            if (IE6 || IE7) {
              var html = "";
              var div = document.createElement("DIV");
              while ($destroyable[0].childNodes.length > 0) {
                var kid = $destroyable[0].childNodes[0];
                for (i = 0; i < kid.attributes.length; i++) {
                  if (kid.attributes[i].nodeName.indexOf("jQuery") === 0) {
                    kid.removeAttribute(kid.attributes[i].nodeName);
                  }
                }
                div.innerHTML = "";
                div.appendChild($destroyable[0].childNodes[0]);
                html += div.innerHTML;
              }
              var overflow = $(options.overflow.id)[0];
              overflow.innerHTML = html;
            } else {
              $(options.overflow.id)
                .empty()
                .append($destroyable.contents().clone(true));
            }
          } else if (!scrollHorizontally) {
            $col = $inBox.children().eq($inBox.children().length - 1);
            $destroyable.contents().each(function () {
              $col.append($(this));
            });
            var afterH = $col.height();
            var diff = afterH - targetHeight;
            var totalH = 0;
            var min = 10000000;
            var max = 0;
            var lastIsMax = false;
            var numberOfColumnsThatDontEndInAColumnBreak = 0;
            $inBox.children().each(
              (function ($inBox) {
                return function ($item) {
                  var $col = $inBox.children().eq($item);
                  var endsInBreak = $col
                    .children(":last")
                    .find(prefixTheClassName("columnbreak", true)).length;
                  if (!endsInBreak) {
                    var h = $col.height();
                    lastIsMax = false;
                    totalH += h;
                    if (h > max) {
                      max = h;
                      lastIsMax = true;
                    }
                    if (h < min) min = h;
                    numberOfColumnsThatDontEndInAColumnBreak++;
                  }
                };
              })($inBox)
            );

            var avgH = totalH / numberOfColumnsThatDontEndInAColumnBreak;
            if (totalH === 0) {
              loopCount = maxLoops;
            } else if (options.lastNeverTallest && lastIsMax) {
              adjustment += 5;

              targetHeight = targetHeight + 30;
              if (loopCount == maxLoops - 1) maxLoops++;
            } else if (max - min > 30) {
              targetHeight = avgH + 30;
            } else if (Math.abs(avgH - targetHeight) > 20) {
              targetHeight = avgH;
            } else {
              loopCount = maxLoops;
            }
          } else {
            $inBox.children().each(function (i) {
              $col = $inBox.children().eq(i);
              $col.width(optionWidth + "px");
              if (i === 0) {
                $col.addClass(prefixTheClassName("first"));
              } else if (i == $inBox.children().length - 1) {
                $col.addClass(prefixTheClassName("last"));
              } else {
                $col.removeClass(prefixTheClassName("first"));
                $col.removeClass(prefixTheClassName("last"));
              }
            });
            $inBox.width($inBox.children().length * optionWidth + "px");
          }
          $inBox.append($("<br style='clear:both;'>"));
        }
        $inBox
          .find(prefixTheClassName("column", true))
          .find(":first" + prefixTheClassName("removeiffirst", true))
          .remove();
        $inBox
          .find(prefixTheClassName("column", true))
          .find(":last" + prefixTheClassName("removeiflast", true))
          .remove();
        $inBox
          .find(prefixTheClassName("split", true))
          .find(":first" + prefixTheClassName("removeiffirst", true))
          .remove();
        $inBox
          .find(prefixTheClassName("split", true))
          .find(":last" + prefixTheClassName("removeiflast", true))
          .remove();
        $inBox.data("columnizing", false);

        if (options.overflow) {
          options.overflow.doneFunc();
        }
        options.doneFunc();
      }
    });
  };

  $.fn.uncolumnize = function () {
    this.each(function () {
      var $el = $(this),
        $clone;

      if (($clone = $el.data(DATA_ORIGINAL_DOM_KEY))) {
        $el.replaceWith($clone);
      }
    });
  };

  $.fn.renumberByJS = function ($searchTag, $colno, $targetId, $targetClass) {
    this.setList = function ($cols, $list, $tag1) {
      var $parents = this.before.parents();
      var $rest;
      $rest = $($cols[this.offset - 1]).find(">*");
      if ($rest.last()[0].tagName != $tag1.toUpperCase()) {
        return 0;
      }
      $rest = $rest.length;
      var $tint = 1;
      if (this.lastOther <= 0) {
        $tint = this.before.children().length + 1;
      } else {
        $tint = $($parents[this.lastOther]).children().length + 1;
      }
      if ($($cols[this.offset]).find($tag1 + ":first li.split").length) {
        var $whereElipsis = $($cols[this.offset - 1]).find(
          $tag1 + ":last li:last"
        );
        if (
          this.elipsisText === "" ||
          $($cols[this.offset - 1]).find($tag1 + ":last ~ div").length ||
          $($cols[this.offset - 1]).find($tag1 + ":last ~ p").length
        ) {
        } else {
          if ($($whereElipsis).find("ul, ol, dl").length == 0) {
            var $txt = $whereElipsis.last().text();
            var $len = $txt.length;
            if ($txt.substring($len - 1) == ";") {
              if ($txt.substring($len - 4) != this.elipsisText + ";") {
                $txt = $txt.substring(0, $len - 1) + this.elipsisText + ";";
              }
            } else {
              if ($txt.substring($len - 3) != this.elipsisText) {
                $txt += this.elipsisText;
              }
            }
            $whereElipsis.last().text($txt);
          }
        }
        if (
          $($cols[this.offset]).find($tag1 + ":first >li.split >" + $tag1)
            .length == 0
        ) {
          $tint--;
        }
      }
      if ($rest == 1) {
        $tint += this.prevMax;
      }
      if (this.nest > 1) {
        $tint--;
        var $tt = $($cols[this.offset - 1]).find(
          $tag1 + ":first li.split:first"
        );
        if ($tt.length > 0) {
          $tint--;
        }
        $tt = $($cols[this.offset])
          .find($tag1 + ":first li:first")
          .clone();
        $tt.children().remove();
        if ($.trim($tt.text()).length > 0) {
          $tint++;

          if (
            $($cols[this.offset - 1])
              .find(">" + $tag1 + ":last ")
              .children().length == 0
          ) {
            $tint--;
          }
        }
      } else {
        var $tt = $($cols[this.offset]).find(
          $tag1 + ":first li:first " + $tag1 + ".split li.split"
        );
        if ($tt.length > 0) {
          $tint--;
        }
      }

      if ($tint > 0) {
        if (typeof this.setColumnStart == "function") {
          this.setColumnStart($list, $tint);
        } else {
          $list.attr("start", $tint);
        }
      }
      return 0;
    };

    if (typeof $targetId === "undefined") {
      $targetId = false;
    }
    if (typeof $targetClass === "undefined") {
      $targetClass = false;
    }
    if (!$targetId && !$targetClass) {
      throw "renumberByJS(): Bad param, must pass an id or a class";
    }

    var $target = "";
    this.prevMax = 1;

    if ($targetClass) {
      $target = "." + $targetClass;
    } else {
      $target = "#" + $targetId;
    }
    var $tag1 = $searchTag.toLowerCase();
    var $tag2 = $searchTag.toUpperCase();

    this.cols = $($target);

    this.before = $(this.cols[0]).find($tag1 + ":last");
    this.prevMax = this.before.children().length;

    for (this.offset = 1; this.offset < this.cols.length; this.offset++) {
      if (this.offset % $colno == 0) {
        this.prevMax = 1;
        continue;
      }

      this.before = $(this.cols[this.offset - 1]).find($tag1 + ":last");
      if (this.before.length) {
        var $list = $(this.cols[this.offset]).find($tag1 + ":first");
        var $first = $(this.cols[this.offset]).find("*:first");
        if ($first[0] !== $list[0]) {
          continue;
        }

        var $parents = this.before.parents();
        this.lastOther = 0;
        var $found = false;
        for (; this.lastOther < $parents.length; this.lastOther++) {
          if (
            $parents[this.lastOther].tagName != $tag2 &&
            $parents[this.lastOther].tagName != "LI"
          ) {
            $found = true;
            this.lastOther--;
            break;
          }
        }

        this.nest = 1;
        if (
          $(this.cols[this.offset]).find(
            ">" + $tag1 + ":first li " + $tag1 + ":first"
          ).length
        ) {
          this.nest = 2;
        }
        this.setList(this.cols, $list, $tag1);
        this.lastOther--;
        $list = $(this.cols[this.offset]).find(
          $tag1 + ":first li " + $tag1 + ":first"
        );
        if ($list.length) {
          this.before = $(this.cols[this.offset - 1]).find(
            ">" + $tag1 + ":last li " + $tag1 + ":last"
          );
          this.prevMax = 0;
          this.nest = 1;
          this.setList(this.cols, $list, $tag1);
        }
        var $reset = $(this.cols[this.offset - 1]).find(">" + $tag1 + ":last");
        this.prevMax = $reset.children().length;
      }
    }
    return 0;
  };
})(jQuery);

/*
= INTERACTIVE BACKGROUND
------------------------------------------------------------------------------------- */

if (!$("html").hasClass("ie11")) {
  var canvas = $("#interactive-bgr canvas").get(0),
    canvasInitialized = false;

  canvas.style.visibility = "hidden";

  resizeCanvas();

  var config = {
    SIM_RESOLUTION: 32,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 2,
    CURL: 0,
    SPLAT_RADIUS: 0.65,
    SPLAT_FORCE: 676,
    SHADING: false,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 1, g: 1, b: 1 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.43,
    BLOOM_THRESHOLD: 0.21,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
  };

  function pointerPrototype() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
  }

  var pointers = [];
  var splatStack = [];
  pointers.push(new pointerPrototype());

  var ref = getWebGLContext(canvas);
  var gl = ref.gl;
  var ext = ref.ext;

  if (isMobile()) {
    config.DYE_RESOLUTION = 512;
  }
  if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 512;
    config.SHADING = false;
    config.BLOOM = false;
    config.SUNRAYS = false;
  }

  function getWebGLContext(canvas) {
    var params = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    var gl = canvas.getContext("webgl2", params);
    var isWebGL2 = !!gl;
    if (!isWebGL2) {
      gl =
        canvas.getContext("webgl", params) ||
        canvas.getContext("experimental-webgl", params);
    }

    var halfFloat;
    var supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    var halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    var formatRGBA;
    var formatRG;
    var formatR;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        gl.RGBA16F,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
      gl: gl,
      ext: {
        formatRGBA: formatRGBA,
        formatRG: formatRG,
        formatR: formatR,
        halfFloatTexType: halfFloatTexType,
        supportLinearFiltering: supportLinearFiltering,
      },
    };
  }

  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default:
          return null;
      }
    }

    return {
      internalFormat: internalFormat,
      format: format,
    };
  }

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
  }

  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  function framebufferToTexture(target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    var length = target.width * target.height * 4;
    var texture = new Float32Array(length);
    gl.readPixels(
      0,
      0,
      target.width,
      target.height,
      gl.RGBA,
      gl.FLOAT,
      texture
    );
    return texture;
  }

  function normalizeTexture(texture, width, height) {
    var result = new Uint8Array(texture.length);
    var id = 0;
    for (var i = height - 1; i >= 0; i--) {
      for (var j = 0; j < width; j++) {
        var nid = i * width * 4 + j * 4;
        result[nid + 0] = clamp01(texture[id + 0]) * 255;
        result[nid + 1] = clamp01(texture[id + 1]) * 255;
        result[nid + 2] = clamp01(texture[id + 2]) * 255;
        result[nid + 3] = clamp01(texture[id + 3]) * 255;
        id += 4;
      }
    }
    return result;
  }

  function clamp01(input) {
    return Math.min(Math.max(input, 0), 1);
  }

  var Material = function Material(vertexShader, fragmentShaderSource) {
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
    this.programs = [];
    this.activeProgram = null;
    this.uniforms = [];
  };

  Material.prototype.setKeywords = function setKeywords(keywords) {
    var hash = 0;
    for (var i = 0; i < keywords.length; i++) {
      hash += hashCode(keywords[i]);
    }

    var program = this.programs[hash];
    if (program == null) {
      var fragmentShader = compileShader(
        gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );
      program = createProgram(this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }

    if (program == this.activeProgram) {
      return;
    }

    this.uniforms = getUniforms(program);
    this.activeProgram = program;
  };

  Material.prototype.bind = function bind() {
    gl.useProgram(this.activeProgram);
  };

  var Program = function Program(vertexShader, fragmentShader) {
    this.uniforms = {};
    this.program = createProgram(vertexShader, fragmentShader);
    this.uniforms = getUniforms(this.program);
  };

  Program.prototype.bind = function bind() {
    gl.useProgram(this.program);
  };

  function createProgram(vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }

    return program;
  }

  function getUniforms(program) {
    var uniforms = [];
    var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < uniformCount; i++) {
      var uniformName = gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  function compileShader(type, source, keywords) {
    source = addKeywords(source, keywords);

    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }

    return shader;
  }

  function addKeywords(source, keywords) {
    if (keywords == null) {
      return source;
    }
    var keywordsString = "";
    keywords.forEach(function (keyword) {
      keywordsString += "#define " + keyword + "\n";
    });
    return keywordsString + source;
  }

  var baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    "\n    precision highp float;\n\n    attribute vec2 aPosition;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform vec2 texelSize;\n\n    void main () {\n        vUv = aPosition * 0.5 + 0.5;\n        vL = vUv - vec2(texelSize.x, 0.0);\n        vR = vUv + vec2(texelSize.x, 0.0);\n        vT = vUv + vec2(0.0, texelSize.y);\n        vB = vUv - vec2(0.0, texelSize.y);\n        gl_Position = vec4(aPosition, 0.0, 1.0);\n    }\n"
  );

  var blurVertexShader = compileShader(
    gl.VERTEX_SHADER,
    "\n    precision highp float;\n\n    attribute vec2 aPosition;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    uniform vec2 texelSize;\n\n    void main () {\n        vUv = aPosition * 0.5 + 0.5;\n        float offset = 1.33333333;\n        vL = vUv - texelSize * offset;\n        vR = vUv + texelSize * offset;\n        gl_Position = vec4(aPosition, 0.0, 1.0);\n    }\n"
  );

  var blurShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    uniform sampler2D uTexture;\n\n    void main () {\n        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;\n        sum += texture2D(uTexture, vL) * 0.35294117;\n        sum += texture2D(uTexture, vR) * 0.35294117;\n        gl_FragColor = sum;\n    }\n"
  );

  var copyShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    uniform sampler2D uTexture;\n\n    void main () {\n        gl_FragColor = texture2D(uTexture, vUv);\n    }\n"
  );

  var clearShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float value;\n\n    void main () {\n        gl_FragColor = value * texture2D(uTexture, vUv);\n    }\n"
  );

  var colorShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n\n    uniform vec4 color;\n\n    void main () {\n        gl_FragColor = color;\n    }\n"
  );

  var checkerboardShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float aspectRatio;\n\n    #define SCALE 25.0\n\n    void main () {\n        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));\n        float v = mod(uv.x + uv.y, 2.0);\n        v = v * 0.1 + 0.8;\n        gl_FragColor = vec4(vec3(v), 1.0);\n    }\n"
  );

  var displayShaderSource =
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform sampler2D uBloom;\n    uniform sampler2D uSunrays;\n    uniform sampler2D uDithering;\n    uniform vec2 ditherScale;\n    uniform vec2 texelSize;\n\n    vec3 linearToGamma (vec3 color) {\n        color = max(color, vec3(0));\n        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));\n    }\n\n    void main () {\n        vec3 c = texture2D(uTexture, vUv).rgb;\n\n    #ifdef SHADING\n        vec3 lc = texture2D(uTexture, vL).rgb;\n        vec3 rc = texture2D(uTexture, vR).rgb;\n        vec3 tc = texture2D(uTexture, vT).rgb;\n        vec3 bc = texture2D(uTexture, vB).rgb;\n\n        float dx = length(rc) - length(lc);\n        float dy = length(tc) - length(bc);\n\n        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n        vec3 l = vec3(0.0, 0.0, 1.0);\n\n        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n        c *= diffuse;\n    #endif\n\n    #ifdef BLOOM\n        vec3 bloom = texture2D(uBloom, vUv).rgb;\n    #endif\n\n    #ifdef SUNRAYS\n        float sunrays = texture2D(uSunrays, vUv).r;\n        c *= sunrays;\n    #ifdef BLOOM\n        bloom *= sunrays;\n    #endif\n    #endif\n\n    #ifdef BLOOM\n        float noise = texture2D(uDithering, vUv * ditherScale).r;\n        noise = noise * 2.0 - 1.0;\n        bloom += noise / 255.0;\n        bloom = linearToGamma(bloom);\n        c += bloom;\n    #endif\n\n        float a = max(c.r, max(c.g, c.b));\n        gl_FragColor = vec4(c, a);\n    }\n";

  var bloomPrefilterShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform vec3 curve;\n    uniform float threshold;\n\n    void main () {\n        vec3 c = texture2D(uTexture, vUv).rgb;\n        float br = max(c.r, max(c.g, c.b));\n        float rq = clamp(br - curve.x, 0.0, curve.y);\n        rq = curve.z * rq * rq;\n        c *= max(rq, br - threshold) / max(br, 0.0001);\n        gl_FragColor = vec4(c, 0.0);\n    }\n"
  );

  var bloomBlurShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n\n    void main () {\n        vec4 sum = vec4(0.0);\n        sum += texture2D(uTexture, vL);\n        sum += texture2D(uTexture, vR);\n        sum += texture2D(uTexture, vT);\n        sum += texture2D(uTexture, vB);\n        sum *= 0.25;\n        gl_FragColor = sum;\n    }\n"
  );

  var bloomFinalShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform float intensity;\n\n    void main () {\n        vec4 sum = vec4(0.0);\n        sum += texture2D(uTexture, vL);\n        sum += texture2D(uTexture, vR);\n        sum += texture2D(uTexture, vT);\n        sum += texture2D(uTexture, vB);\n        sum *= 0.25;\n        gl_FragColor = sum * intensity;\n    }\n"
  );

  var sunraysMaskShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n\n    void main () {\n        vec4 c = texture2D(uTexture, vUv);\n        float br = max(c.r, max(c.g, c.b));\n        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);\n        gl_FragColor = c;\n    }\n"
  );

  var sunraysShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float weight;\n\n    #define ITERATIONS 16\n\n    void main () {\n        float Density = 0.3;\n        float Decay = 0.95;\n        float Exposure = 0.7;\n\n        vec2 coord = vUv;\n        vec2 dir = vUv - 0.5;\n\n        dir *= 1.0 / float(ITERATIONS) * Density;\n        float illuminationDecay = 1.0;\n\n        float color = texture2D(uTexture, vUv).a;\n\n        for (int i = 0; i < ITERATIONS; i++)\n        {\n            coord -= dir;\n            float col = texture2D(uTexture, coord).a;\n            color += col * illuminationDecay * weight;\n            illuminationDecay *= Decay;\n        }\n\n        gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);\n    }\n"
  );

  var splatShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTarget;\n    uniform float aspectRatio;\n    uniform vec3 color;\n    uniform vec2 point;\n    uniform float radius;\n\n    void main () {\n        vec2 p = vUv - point.xy;\n        p.x *= aspectRatio;\n        vec3 splat = exp(-dot(p, p) / radius) * color;\n        vec3 base = texture2D(uTarget, vUv).xyz;\n        gl_FragColor = vec4(base + splat, 1.0);\n    }\n"
  );

  var advectionShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform vec2 dyeTexelSize;\n    uniform float dt;\n    uniform float dissipation;\n\n    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {\n        vec2 st = uv / tsize - 0.5;\n\n        vec2 iuv = floor(st);\n        vec2 fuv = fract(st);\n\n        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);\n        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);\n        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);\n        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);\n\n        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);\n    }\n\n    void main () {\n    #ifdef MANUAL_FILTERING\n        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;\n        vec4 result = bilerp(uSource, coord, dyeTexelSize);\n    #else\n        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;\n        vec4 result = texture2D(uSource, coord);\n    #endif\n        float decay = 1.0 + dissipation * dt;\n        gl_FragColor = result / decay;\n    }",
    ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]
  );

  var divergenceShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n\n    void main () {\n        float L = texture2D(uVelocity, vL).x;\n        float R = texture2D(uVelocity, vR).x;\n        float T = texture2D(uVelocity, vT).y;\n        float B = texture2D(uVelocity, vB).y;\n\n        vec2 C = texture2D(uVelocity, vUv).xy;\n        if (vL.x < 0.0) { L = -C.x; }\n        if (vR.x > 1.0) { R = -C.x; }\n        if (vT.y > 1.0) { T = -C.y; }\n        if (vB.y < 0.0) { B = -C.y; }\n\n        float div = 0.5 * (R - L + T - B);\n        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);\n    }\n"
  );

  var curlShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n\n    void main () {\n        float L = texture2D(uVelocity, vL).y;\n        float R = texture2D(uVelocity, vR).y;\n        float T = texture2D(uVelocity, vT).x;\n        float B = texture2D(uVelocity, vB).x;\n        float vorticity = R - L - T + B;\n        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);\n    }\n"
  );

  var vorticityShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uCurl;\n    uniform float curl;\n    uniform float dt;\n\n    void main () {\n        float L = texture2D(uCurl, vL).x;\n        float R = texture2D(uCurl, vR).x;\n        float T = texture2D(uCurl, vT).x;\n        float B = texture2D(uCurl, vB).x;\n        float C = texture2D(uCurl, vUv).x;\n\n        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n        force /= length(force) + 0.0001;\n        force *= curl * C;\n        force.y *= -1.0;\n\n        vec2 vel = texture2D(uVelocity, vUv).xy;\n        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);\n    }\n"
  );

  var pressureShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uDivergence;\n\n    void main () {\n        float L = texture2D(uPressure, vL).x;\n        float R = texture2D(uPressure, vR).x;\n        float T = texture2D(uPressure, vT).x;\n        float B = texture2D(uPressure, vB).x;\n        float C = texture2D(uPressure, vUv).x;\n        float divergence = texture2D(uDivergence, vUv).x;\n        float pressure = (L + R + B + T - divergence) * 0.25;\n        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);\n    }\n"
  );

  var gradientSubtractShader = compileShader(
    gl.FRAGMENT_SHADER,
    "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uVelocity;\n\n    void main () {\n        float L = texture2D(uPressure, vL).x;\n        float R = texture2D(uPressure, vR).x;\n        float T = texture2D(uPressure, vT).x;\n        float B = texture2D(uPressure, vB).x;\n        vec2 velocity = texture2D(uVelocity, vUv).xy;\n        velocity.xy -= vec2(R - L, T - B);\n        gl_FragColor = vec4(velocity, 0.0, 1.0);\n    }\n"
  );

  var blit = (function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return function (destination) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  var dye;
  var velocity;
  var divergence;
  var curl;
  var pressure;
  var bloom;
  var bloomFramebuffers = [];
  var sunrays;
  var sunraysTemp;

  var ditheringTexture = createTextureAsync(themeUrl + "/assets/img/noise.png");

  var blurProgram = new Program(blurVertexShader, blurShader);
  var copyProgram = new Program(baseVertexShader, copyShader);
  var clearProgram = new Program(baseVertexShader, clearShader);
  var colorProgram = new Program(baseVertexShader, colorShader);
  var checkerboardProgram = new Program(baseVertexShader, checkerboardShader);
  var bloomPrefilterProgram = new Program(
    baseVertexShader,
    bloomPrefilterShader
  );
  var bloomBlurProgram = new Program(baseVertexShader, bloomBlurShader);
  var bloomFinalProgram = new Program(baseVertexShader, bloomFinalShader);
  var sunraysMaskProgram = new Program(baseVertexShader, sunraysMaskShader);
  var sunraysProgram = new Program(baseVertexShader, sunraysShader);
  var splatProgram = new Program(baseVertexShader, splatShader);
  var advectionProgram = new Program(baseVertexShader, advectionShader);
  var divergenceProgram = new Program(baseVertexShader, divergenceShader);
  var curlProgram = new Program(baseVertexShader, curlShader);
  var vorticityProgram = new Program(baseVertexShader, vorticityShader);
  var pressureProgram = new Program(baseVertexShader, pressureShader);
  var gradienSubtractProgram = new Program(
    baseVertexShader,
    gradientSubtractShader
  );

  var displayMaterial = new Material(baseVertexShader, displayShaderSource);

  function initFramebuffers() {
    var simRes = getResolution(config.SIM_RESOLUTION);
    var dyeRes = getResolution(config.DYE_RESOLUTION);

    var texType = ext.halfFloatTexType;
    var rgba = ext.formatRGBA;
    var rg = ext.formatRG;
    var r = ext.formatR;
    var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    if (dye == null) {
      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    } else {
      dye = resizeDoubleFBO(
        dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    }

    if (velocity == null) {
      velocity = createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    } else {
      velocity = resizeDoubleFBO(
        velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    }

    divergence = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    curl = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    pressure = createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    initBloomFramebuffers();
    initSunraysFramebuffers();
  }

  function initBloomFramebuffers() {
    var res = getResolution(config.BLOOM_RESOLUTION);

    var texType = ext.halfFloatTexType;
    var rgba = ext.formatRGBA;
    var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    bloom = createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    bloomFramebuffers.length = 0;
    for (var i = 0; i < config.BLOOM_ITERATIONS; i++) {
      var width = res.width >> (i + 1);
      var height = res.height >> (i + 1);

      if (width < 2 || height < 2) {
        break;
      }

      var fbo = createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      bloomFramebuffers.push(fbo);
    }
  }

  function initSunraysFramebuffers() {
    var res = getResolution(config.SUNRAYS_RESOLUTION);

    var texType = ext.halfFloatTexType;
    var r = ext.formatR;
    var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    sunrays = createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
    sunraysTemp = createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
  }

  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      type,
      null
    );

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var texelSizeX = 1.0 / w;
    var texelSizeY = 1.0 / h;

    return {
      texture: texture,
      fbo: fbo,
      width: w,
      height: h,
      texelSizeX: texelSizeX,
      texelSizeY: texelSizeY,
      attach: function attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    var fbo1 = createFBO(w, h, internalFormat, format, type, param);
    var fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap: function swap() {
        var temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  function resizeFBO(target, w, h, internalFormat, format, type, param) {
    var newFBO = createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO.fbo);
    return newFBO;
  }

  function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
    if (target.width == w && target.height == h) {
      return target;
    }
    target.read = resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
  }

  function createTextureAsync(url) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255])
    );

    var obj = {
      texture: texture,
      width: 1,
      height: 1,
      attach: function attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };

    var image = new Image();
    image.onload = function () {
      obj.width = image.width;
      obj.height = image.height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
    image.src = url;

    return obj;
  }

  function updateKeywords() {
    var displayKeywords = [];
    if (config.SHADING) {
      displayKeywords.push("SHADING");
    }
    if (config.BLOOM) {
      displayKeywords.push("BLOOM");
    }
    if (config.SUNRAYS) {
      displayKeywords.push("SUNRAYS");
    }
    displayMaterial.setKeywords(displayKeywords);
  }

  updateKeywords();
  initFramebuffers();

  var lastUpdateTime = Date.now();
  var colorUpdateTimer = 0.0;
  if (!$("html").hasClass("mobile")) update();

  function update() {
    var dt = calcDeltaTime();
    if (resizeCanvas()) {
      initFramebuffers();
    }
    updateColors(dt);
    applyInputs();
    if (!config.PAUSED) {
      step(dt);
    }
    render(null);
    requestAnimationFrame(update);
  }

  function calcDeltaTime() {
    var now = Date.now();
    var dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function resizeCanvas() {
    var width = scaleByPixelRatio(canvas.clientWidth);
    var height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  function updateColors(dt) {
    if (!config.COLORFUL) {
      return;
    }

    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      pointers.forEach(function (p) {
        p.color = generateColor();
      });
    }
  }

  function applyInputs() {
    if (splatStack.length > 0) {
      multipleSplats(splatStack.pop());
    }

    pointers.forEach(function (p) {
      if (p.moved) {
        p.moved = false;
        splatPointer(p);
      }
    });
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, velocity.width, velocity.height);

    curlProgram.bind();
    gl.uniform2f(
      curlProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl.fbo);

    vorticityProgram.bind();
    gl.uniform2f(
      vorticityProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write.fbo);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(
      divergenceProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence.fbo);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write.fbo);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(
      pressureProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write.fbo);
      pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(
      gradienSubtractProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    gl.uniform1i(
      gradienSubtractProgram.uniforms.uPressure,
      pressure.read.attach(0)
    );
    gl.uniform1i(
      gradienSubtractProgram.uniforms.uVelocity,
      velocity.read.attach(1)
    );
    blit(velocity.write.fbo);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(
      advectionProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY
    );
    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
    }
    var velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.VELOCITY_DISSIPATION
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);

    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        dye.texelSizeX,
        dye.texelSizeY
      );
    }
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION
    );
    blit(dye.write.fbo);
    dye.swap();
  }

  function render(target) {
    if (config.BLOOM) {
      applyBloom(dye.read, bloom);
    }
    if (config.SUNRAYS) {
      applySunrays(dye.read, dye.write, sunrays);
      blur(sunrays, sunraysTemp, 1);
    }

    if (target == null || !config.TRANSPARENT) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }

    var width = target == null ? gl.drawingBufferWidth : target.width;
    var height = target == null ? gl.drawingBufferHeight : target.height;
    gl.viewport(0, 0, width, height);

    var fbo = target == null ? null : target.fbo;
    if (!config.TRANSPARENT) {
      drawColor(fbo, normalizeColor(config.BACK_COLOR));
    }
    if (target == null && config.TRANSPARENT) {
      drawCheckerboard(fbo);
    }
    drawDisplay(fbo, width, height);
  }

  function drawColor(fbo, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(fbo);
  }

  function drawCheckerboard(fbo) {
    checkerboardProgram.bind();
    gl.uniform1f(
      checkerboardProgram.uniforms.aspectRatio,
      canvas.width / canvas.height
    );
    blit(fbo);
  }

  function drawDisplay(fbo, width, height) {
    displayMaterial.bind();
    if (config.SHADING) {
      gl.uniform2f(
        displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height
      );
    }
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
      gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
      gl.uniform1i(
        displayMaterial.uniforms.uDithering,
        ditheringTexture.attach(2)
      );
      var scale = getTextureScale(ditheringTexture, width, height);
      gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS) {
      gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    }
    blit(fbo);
  }

  function applyBloom(source, destination) {
    if (bloomFramebuffers.length < 2) {
      return;
    }

    var last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    var knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    var curve0 = config.BLOOM_THRESHOLD - knee;
    var curve1 = knee * 2;
    var curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(
      bloomPrefilterProgram.uniforms.threshold,
      config.BLOOM_THRESHOLD
    );
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    gl.viewport(0, 0, last.width, last.height);
    blit(last.fbo);

    bloomBlurProgram.bind();
    for (var i = 0; i < bloomFramebuffers.length; i++) {
      var dest = bloomFramebuffers[i];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, dest.width, dest.height);
      blit(dest.fbo);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (var i$1 = bloomFramebuffers.length - 2; i$1 >= 0; i$1--) {
      var baseTex = bloomFramebuffers[i$1];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      blit(baseTex.fbo);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(
      bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY
    );
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    gl.viewport(0, 0, destination.width, destination.height);
    blit(destination.fbo);
  }

  function applySunrays(source, mask, destination) {
    gl.disable(gl.BLEND);
    sunraysMaskProgram.bind();
    gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    gl.viewport(0, 0, mask.width, mask.height);
    blit(mask.fbo);

    sunraysProgram.bind();
    gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
    gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
    gl.viewport(0, 0, destination.width, destination.height);
    blit(destination.fbo);
  }

  function blur(target, temp, iterations) {
    blurProgram.bind();
    for (var i = 0; i < iterations; i++) {
      gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
      gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
      blit(temp.fbo);

      gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
      gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
      blit(target.fbo);
    }
  }

  function splatPointer(pointer) {
    var dx = pointer.deltaX * config.SPLAT_FORCE;
    var dy = pointer.deltaY * config.SPLAT_FORCE;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  function multipleSplats(amount) {
    for (var i = 0; i < amount; i++) {
      var color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      var x = Math.random();
      var y = Math.random();
      var dx = 1000 * (Math.random() - 0.5);
      var dy = 1000 * (Math.random() - 0.5);
      splat(x, y, dx, dy, color);
    }
  }

  function subtleMultipleSplats(amount) {
    for (var i = 0; i < amount; i++) {
      var color = generateColor();
      color.r *= 4.0;
      color.g *= 4.0;
      color.b *= 4.0;
      var x = Math.random();
      var y = Math.random();
      var dx = 50 * (Math.random() - 0.5);
      var dy = 50 * (Math.random() - 0.5);
      splat(x, y, dx, dy, color);
    }
  }

  function splat(x, y, dx, dy, color) {
    gl.viewport(0, 0, velocity.width, velocity.height);
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(
      splatProgram.uniforms.aspectRatio,
      canvas.width / canvas.height
    );
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(
      splatProgram.uniforms.radius,
      correctRadius(config.SPLAT_RADIUS / 100.0)
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);
    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write.fbo);
    dye.swap();
  }

  function correctRadius(radius) {
    var aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
      radius *= aspectRatio;
    }
    return radius;
  }

  document.addEventListener("mousedown", function (e) {
    var posX = scaleByPixelRatio(e.clientX);
    var posY = scaleByPixelRatio(e.clientY);
    var pointer = pointers.find(function (p) {
      return p.id == -1;
    });
    if (pointer == null) {
      pointer = new pointerPrototype();
    }
    updatePointerDownData(pointer, -1, posX, posY);
  });

  document.addEventListener("mousemove", function (e) {
    if (!canvasInitialized) {
      return;
    }
    var pointer = pointers[0];
    var posX = scaleByPixelRatio(e.clientX);
    var posY = scaleByPixelRatio(e.clientY);
    updatePointerMoveData(pointer, posX, posY);
  });

  window.addEventListener("mouseup", function () {
    updatePointerUpData(pointers[0]);
  });

  document.addEventListener("touchstart", function (e) {
    var touches = e.targetTouches;
    while (touches.length >= pointers.length) {
      pointers.push(new pointerPrototype());
    }
    for (var i = 0; i < touches.length; i++) {
      var posX = scaleByPixelRatio(touches[i].pageX);
      var posY = scaleByPixelRatio(touches[i].clientY);
      updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
    }
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      var touches = e.targetTouches;
      for (var i = 0; i < touches.length; i++) {
        var pointer = pointers[i + 1];
        if (!pointer.down) {
          continue;
        }
        var posX = scaleByPixelRatio(touches[i].pageX);
        var posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(pointer, posX, posY);
      }
    },
    false
  );

  document.addEventListener("touchend", function (e) {
    var touches = e.changedTouches;
    var loop = function (i) {
      var pointer = pointers.find(function (p) {
        return p.id == touches[i].identifier;
      });
      if (pointer == null) {
        return;
      }
      updatePointerUpData(pointer);
    };

    for (var i = 0; i < touches.length; i++) loop(i);
  });

  function updatePointerDownData(pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
  }

  function updatePointerMoveData(pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved =
      Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  }

  function updatePointerUpData(pointer) {
    pointer.down = false;
  }

  function correctDeltaX(delta) {
    var aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) {
      delta *= aspectRatio;
    }
    return delta;
  }

  function correctDeltaY(delta) {
    var aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
      delta /= aspectRatio;
    }
    return delta;
  }

  function generateColor() {
    var c = HSVtoRGB(Math.random(), 1.0, 1.0);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
  }

  function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }

    return {
      r: r,
      g: g * 0.0,
      b: b,
    };
  }

  function normalizeColor(input) {
    var output = {
      r: input.r / 255,
      g: input.g / 255,
      b: input.b / 255,
    };
    return output;
  }

  function wrap(value, min, max) {
    var range = max - min;
    if (range == 0) {
      return min;
    }
    return ((value - min) % range) + min;
  }

  function getResolution(resolution) {
    var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) {
      aspectRatio = 1.0 / aspectRatio;
    }

    var min = Math.round(resolution);
    var max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
      return { width: max, height: min };
    } else {
      return { width: min, height: max };
    }
  }

  function getTextureScale(texture, width, height) {
    return {
      x: width / texture.width,
      y: height / texture.height,
    };
  }

  function scaleByPixelRatio(input) {
    var pixelRatio = 1;
    return Math.floor(input * pixelRatio);
  }

  function hashCode(s) {
    if (s.length == 0) {
      return 0;
    }
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

/*
= ADJUST GOOGLE MAP CENTER
-------------------------------------------------------------------------------------- */

google.maps.Map.prototype.setCenterWithOffset = function (
  latlng,
  offsetX,
  offsetY
) {
  var map = this;
  var ov = new google.maps.OverlayView();
  ov.onAdd = function () {
    var proj = this.getProjection();
    var aPoint = proj.fromLatLngToContainerPixel(latlng);
    aPoint.x = aPoint.x + offsetX;
    aPoint.y = aPoint.y + offsetY;
    map.panTo(proj.fromContainerPixelToLatLng(aPoint));
  };
  ov.draw = function () {
    this.getPanes().markerLayer.id = "marker";
  };
  ov.setMap(this);
};

/*
= MAIN CONTROLLER
-------------------------------------------------------------------------------------- */

var cf = {
  windowW: 0,
  windowH: $(window).height(),
  currPopupOffset: 0,
  html: $("html"),
  body: $("body"),
  device: null,
  popupOpened: false,
  distanceFromTop: 0,
  lastDistanceFromTop: 0,
  resizeTimeout: null,
  navOpened: false,
  activeSection: $(".hero"),
  mapViewed: false,
  fancyboxOpened: false,
  mapInitialized: false,
  inactivityInterval: null,
  clonedFooter: false,
  invertedBlog: false,
  init: function () {
    /*
        + Preloading */

    var initAnimTimeout = null,
      headerAnimTimeout = null;

    var loader = bodymovin.loadAnimation({
      container: document.getElementById("loader"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: themeUrl + "/assets/js/loader.json",
    });
    loader.setSpeed(1.5);

    cf.body.preloading({
      beforeComplete: function () {
        var map = $("#map");
        if (map.length) {
          map.parent().show();
          cf.common.map.init();
          cf.common.map.resize();
          if (cf.device != "mobile") map.parent().hide();
          cf.mapInitialized = true;
        }
        initAnimTimeout = setTimeout(function () {
          cf.body.addClass("init-anim");
          $(".hero, .blog-outer").addClass("active");
          if (window.location.hash) {
            if (!$(".members-list").length) {
              $("section").each(function () {
                var curr = $(this),
                  currHash = "#" + curr.data("hash");
                if (currHash != undefined && window.location.hash == currHash) {
                  var currIndex = curr.index();
                  cf.device != "mobile"
                    ? $(".side-nav")
                        .children()
                        .eq(currIndex)
                        .find("a")
                        .trigger("click")
                    : $("html, body")
                        .stop()
                        .animate(
                          { scrollTop: curr.offset().top },
                          2000,
                          "easeInOutCubic"
                        );
                  return false;
                }
              });
            } else {
              var currHash = window.location.hash,
                currDataHash = currHash.slice(1);
              if (
                $('.members-list li[data-hash="' + currDataHash + '"]').length
              )
                $(
                  '.members-list li[data-hash="' + currDataHash + '"] a'
                ).trigger("click");
              console.log(currHash);
            }
          }
          clearTimeout(initAnimTimeout);
          initAnimTimeout = null;
        }, 500);
        if (!cf.html.hasClass("ie11") && !cf.html.hasClass("edge")) {
          headerAnimTimeout = setTimeout(function () {
            var whiteLogoAnim = bodymovin.loadAnimation({
              container: document.getElementById("light-logo"),
              renderer: "svg",
              loop: false,
              autoplay: true,
              path: themeUrl + "/assets/js/logo-white.json",
            });
            var blackLogoAnim = bodymovin.loadAnimation({
              container: document.getElementById("dark-logo"),
              renderer: "svg",
              loop: false,
              autoplay: true,
              path: themeUrl + "/assets/js/logo-black.json",
            });
            clearTimeout(headerAnimTimeout);
            headerAnimTimeout = null;
          }, 1000);
        }
        if (cf.device != "mobile" && !cf.html.hasClass("ie11")) {
          canvas.style.visibility = "visible";
          canvasInitialized = true;
          multipleSplats(parseInt(Math.random() * 5) + 5);
          if (cf.body.hasClass("blog")) {
            config.BACK_COLOR.r = 246;
            config.BACK_COLOR.g = 246;
            config.BACK_COLOR.b = 246;
            config.BLOOM_INTENSITY = 0.0;
            if ($(".beneath-blog").length) {
              if (
                $(".beneath-blog").offset().top - $(window).scrollTop() <
                $(window).height() / 2
              ) {
                $(".beneath-blog").removeClass("inverted");
                $(".blog-outer").addClass("inverted");
                $("#interactive-bgr .overlay").removeClass("light");
                config.BACK_COLOR.r = 1;
                config.BACK_COLOR.g = 1;
                config.BACK_COLOR.b = 1;
                config.BLOOM_INTENSITY = 0.2;
                cf.invertedBlog = true;
              } else {
                config.BACK_COLOR.r = 246;
                config.BACK_COLOR.g = 246;
                config.BACK_COLOR.b = 246;
                config.BLOOM_INTENSITY = 0.0;
                $("#interactive-bgr .overlay").addClass("light");
              }
            }
          }
        }
      },
      onComplete: function () {
        if (cf.device == "mobile") {
          update();
          canvas.style.visibility = "visible";
          canvasInitialized = true;
          multipleSplats(parseInt(Math.random() * 5) + 5);
          if (cf.body.hasClass("blog")) {
            config.BACK_COLOR.r = 246;
            config.BACK_COLOR.g = 246;
            config.BACK_COLOR.b = 246;
            config.BLOOM_INTENSITY = 0.0;
            $("#interactive-bgr .overlay").addClass("light");
          }
          if ($(".beneath-blog").length) {
            if (
              $(".beneath-blog").offset().top - $(window).scrollTop() <
              $(window).height() / 2
            ) {
              $(".beneath-blog").removeClass("inverted");
              $(".blog-outer").addClass("inverted");
              $("#interactive-bgr .overlay").removeClass("light");
              config.BACK_COLOR.r = 1;
              config.BACK_COLOR.g = 1;
              config.BACK_COLOR.b = 1;
              config.BLOOM_INTENSITY = 0.2;
              cf.invertedBlog = true;
            } else {
              config.BACK_COLOR.r = 246;
              config.BACK_COLOR.g = 246;
              config.BACK_COLOR.b = 246;
              config.BLOOM_INTENSITY = 0.0;
              $("#interactive-bgr .overlay").addClass("light");
            }
          }
        }
        if (!cf.html.hasClass("ie11")) cf.common.inactivityTime();
      },
    });

    /*
        + Detecting device */

    if (cf.html.hasClass("desktop")) {
      cf.device = "desktop";
    } else if (cf.html.hasClass("tablet")) {
      cf.device = "tablet";
    } else if (cf.html.hasClass("mobile")) {
      cf.device = "mobile";
    }

    /*
        + Choosing theme */

    cf.device == "desktop" ? this.desktop.init() : this.handheld.init();
  },
  transformSetter: function (x, y, scaleX, scaleY) {
    return {
      "-webkit-transform":
        "translateX(" +
        x +
        ") translateY(" +
        y +
        ") translateZ(0px) rotate(0deg) scale(" +
        scaleX +
        ", " +
        scaleY +
        ")",
      "-moz-transform":
        "translateX(" +
        x +
        ") translateY(" +
        y +
        ") translateZ(0px) rotate(0deg) scale(" +
        scaleX +
        ", " +
        scaleY +
        ")",
      transform:
        "translateX(" +
        x +
        ") translateY(" +
        y +
        ") translateZ(0px) rotate(0deg) scale(" +
        scaleX +
        ", " +
        scaleY +
        ")",
    };
  },
  transitionSetter: function (property, duration, delay, easing) {
    return {
      "-webkit-transition":
        property + " " + duration + " " + delay + " " + easing,
      "-moz-transition": property + " " + duration + " " + delay + " " + easing,
      "-o-transition": property + " " + duration + " " + delay + " " + easing,
      "-ms-transition": property + " " + duration + " " + delay + " " + easing,
      transition: property + " " + duration + " " + delay + " " + easing,
    };
  },
  delaySetter: function (delay) {
    return {
      "-webkit-transition-delay": delay + "ms",
      "-moz-transition-delay": delay + "ms",
      "-ms-transition-delay": delay + "ms",
      "-o-transition-delay": delay + "ms",
      "transition-delay": delay + "ms",
    };
  },
  splitLines: function (element, lineHeight) {
    element.find("tspan").each(function () {
      $(this).css("display", "").replaceWith(this.childNodes);
    });
    var currStr = element.text(),
      spanInserted = element.html().split(" ").join(' </tspan><tspan x="0">'),
      wrapped = '<tspan x="0">'.concat(spanInserted, "</tspan>");
    element.html(wrapped);
    var refPos = element.find("tspan:first-child").position().top,
      newPos;
    element.find("tspan").each(function (i) {
      var curr = $(this);
      curr.attr("dY", lineHeight);
      newPos = curr.position().top;
      if (i == 0) return;
      if (newPos == refPos) {
        curr.prepend(curr.prev().text() + " ");
        curr.prev().remove();
      }
      refPos = newPos;
    });
    element.find("tspan").css("display", "block");
    element.find("tspan:empty").remove();
  },
  snap: {
    init: function () {
      var sideNav = $(".side-nav"),
        section = $("section"),
        bgrs = $(".bgrs"),
        running = false,
        runningTimeout = null,
        prepTimeout = null;

      $("section").each(function () {
        var curr = $(this);
        curr.hasClass("hero") ? curr.show() : curr.hide();
      });

      function moving(active, curr) {
        if (!cf.html.hasClass("ie11"))
          multipleSplats(parseInt(Math.random() * 1) + 2);
        running = true;
        cf.activeSection = curr;
        curr.show();
        if (curr.is(".scrollable") && !curr.is(".blog-outer")) {
          curr.stop().animate({
            scrollTop: "0",
          });
        }

        if (
          (curr.hasClass("light") && curr.hasClass("blog-outer")) ||
          (curr.hasClass("light") && curr.hasClass("simple")) ||
          curr.hasClass("with-auto-height") ||
          (curr.hasClass("with-slider") && curr.hasClass("light")) ||
          (curr.hasClass("with-sub-elements") && curr.hasClass("light"))
        ) {
          if (!cf.html.hasClass("ie11")) {
            TweenLite.to(config.BACK_COLOR, 0.5, {
              r: 246,
              ease: Linear.easeNone,
            });
            TweenLite.to(config.BACK_COLOR, 0.5, {
              g: 246,
              ease: Linear.easeNone,
            });
            TweenLite.to(config.BACK_COLOR, 0.5, {
              b: 246,
              ease: Linear.easeNone,
            });
            TweenLite.to(config, 0.5, {
              BLOOM_INTENSITY: 0.0,
              ease: Linear.easeNone,
            });
          }
          $("#interactive-bgr .overlay")
            .removeClass("semidark")
            .addClass("light");
        } else if (curr.hasClass("simple") && curr.hasClass("with-bgr")) {
          TweenLite.to(config, 0.5, {
            BLOOM_INTENSITY: 0.0,
            ease: Linear.easeNone,
          });
          $("#interactive-bgr .overlay")
            .removeClass("light")
            .addClass("semidark");
        } else {
          if (!cf.html.hasClass("ie11")) {
            TweenLite.to(config.BACK_COLOR, 0.5, {
              r: 1,
              ease: Linear.easeNone,
            });
            TweenLite.to(config.BACK_COLOR, 0.5, {
              g: 1,
              ease: Linear.easeNone,
            });
            TweenLite.to(config.BACK_COLOR, 0.5, {
              b: 1,
              ease: Linear.easeNone,
            });
            TweenLite.to(config, 0.5, {
              BLOOM_INTENSITY: 0.2,
              ease: Linear.easeNone,
            });
          }
          $("#interactive-bgr .overlay")
            .removeClass("semidark")
            .removeClass("light");
        }
        if (curr.index() > active.index()) {
          if (curr.hasClass("scrollable"))
            $(".side-nav").css({
              opacity: "0",
              pointerEvents: "none",
            });

          active
            .find("article, form")
            .children()
            .each(function () {
              var curr = $(this);
              curr.css(cf.delaySetter(curr.data("delay-up")));
            });
          curr
            .find("article, form")
            .children()
            .each(function () {
              var curr = $(this);
              curr.css(cf.delaySetter(curr.data("delay-anim-up")));
            });
          prepTimeout = setTimeout(function () {
            curr.addClass("active").removeClass("down up");
            if (active.hasClass("hero") || active.hasClass("simple")) {
              var currY =
                active.find("article").position().top +
                active.find("article").outerHeight();
              active
                .find("article, form")
                .children()
                .css(cf.transformSetter("0px", -currY + "px", 1, 1));
            }
            if (active.hasClass("with-sub-elements")) {
              if (active.find(".holder").length) {
                var currY =
                  active.find(".holder").position().top +
                  active.find(".holder").outerHeight() * 1.5;
                active
                  .find(".holder")
                  .css(cf.transformSetter("0px", -currY + "px", 1, 1));
              }
            }
            if (curr.hasClass("hero") || curr.hasClass("simple"))
              curr
                .find("article, form")
                .children()
                .css(cf.transformSetter("0px", "0px", 1, 1));
            if (curr.hasClass("with-sub-elements"))
              if (curr.find(".holder").length) {
                curr
                  .find(".holder")
                  .css(cf.transformSetter("0px", "-50%", 1, 1));
              }
            active.addClass("up");
            for (var i = active.index() + 1; i < curr.index(); i++) {
              section.eq(i).addClass("up").removeClass("down");
              if (
                section.eq(i).hasClass("hero") ||
                section.eq(i).hasClass("simple")
              ) {
                section.eq(i).show();
                var currY =
                  active.find("article").position().top +
                  active.find("article").outerHeight();
                section
                  .eq(i)
                  .find("article, form")
                  .children()
                  .css(cf.transformSetter("0px", -currY + "px", 1, 1));
                section.eq(i).hide();
              }
              if (section.eq(i).hasClass("with-sub-elements")) {
                if (section.eq(i).find(".holder").length) {
                  section.eq(i).show();
                  var currY =
                    section.eq(i).find(".holder").position().top +
                    section.eq(i).find(".holder").outerHeight() * 1.5;
                  section
                    .eq(i)
                    .find(".holder")
                    .css(cf.transformSetter("0px", -currY + "px", 1, 1));
                  section.eq(i).hide();
                }
              }
            }
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 50);
        } else {
          $(".side-nav").removeAttr("style");

          active
            .find("article, form")
            .children()
            .each(function () {
              var curr = $(this);
              curr.css(cf.delaySetter(curr.data("delay-down")));
            });
          curr
            .find("article, form")
            .children()
            .each(function () {
              var curr = $(this);
              curr.css(cf.delaySetter(curr.data("delay-anim-down")));
            });
          prepTimeout = setTimeout(function () {
            curr.addClass("active").removeClass("down up");
            if (active.hasClass("with-sub-elements")) {
              if (active.find(".holder").length) {
                active
                  .find(".holder")
                  .css(cf.transformSetter("0px", "calc(-50% + 100px)", 1, 1));
              }
            }
            if (active.hasClass("hero") || active.hasClass("simple"))
              active
                .find("article, form")
                .children()
                .css(cf.transformSetter("0px", "100px", 1, 1));
            if (curr.hasClass("hero") || curr.hasClass("simple"))
              curr
                .find("article, form")
                .children()
                .css(cf.transformSetter("0px", "0px", 1, 1));
            if (curr.hasClass("with-sub-elements")) {
              if (curr.find(".holder").length) {
                curr
                  .find(".holder")
                  .css(cf.transformSetter("0px", "-50%", 1, 1));
              }
            }
            active.addClass("down");
            for (var i = section.length - 1; i > curr.index(); i--) {
              section.eq(i).addClass("down").removeClass("up");
              if (
                section.eq(i).hasClass("hero") ||
                section.eq(i).hasClass("simple")
              )
                section
                  .eq(i)
                  .find("article, form")
                  .children()
                  .css(cf.transformSetter("0px", "100px" + "px", 1, 1));
              if (section.eq(i).hasClass("with-sub-elements")) {
                if (section.eq(i).find(".holder").length) {
                  section
                    .eq(i)
                    .find(".holder")
                    .css(cf.transformSetter("0px", "calc(-50% + 100px)", 1, 1));
                }
              }
            }
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 50);
        }
        runningTimeout = setTimeout(
          function () {
            running = false;
            active.removeClass("active").hide();
            cf.body.removeClass("switching");
            sideNav.children().removeClass("faded");
            clearTimeout(runningTimeout);
            runningTimeout = null;
          },
          curr.hasClass("footer") ? 1200 : 1600
        );
        sideNav
          .children()
          .removeClass("active")
          .eq(curr.index())
          .addClass("active");
        sideNav.children().eq(active.index()).addClass("faded");
        cf.body.addClass("switching");
        curr.data("header-color") == "dark"
          ? $("header").addClass("dark")
          : $("header").removeClass("dark");
        curr.data("side-nav-color") == "dark"
          ? sideNav.addClass("dark")
          : sideNav.removeClass("dark");
        if (
          curr.hasClass("with-bgr") &&
          curr.hasClass("bgr-revealed") &&
          viewport().width <= 1024
        )
          sideNav.addClass("dark");
      }

      function movingSubElements(active, curr) {
        if (!cf.html.hasClass("ie11"))
          multipleSplats(parseInt(Math.random() * 1) + 2);
        running = true;
        cf.body.addClass("switching");
        $(".side-nav li")
          .eq(curr.parents("section").index())
          .find("a svg ellipse")
          .css({
            strokeDashoffset:
              360 -
              63 * (curr.index() / (curr.parents("ol").children().length - 1)),
          });
        if (active.index() < curr.index()) {
          active.removeClass("active").addClass("up");
          for (var i = 0; i < curr.index(); i++) {
            active
              .parents("section")
              .find(".pagination strong span")
              .eq(i)
              .removeClass("down")
              .addClass("up");
            active.parent().children().eq(i).removeClass("down").addClass("up");
          }
        } else {
          active.removeClass("active").addClass("down");
          for (
            var i = curr.index() + 1;
            i < active.parent().children().length;
            i++
          ) {
            active
              .parents("section")
              .find(".pagination strong span")
              .eq(i)
              .removeClass("up")
              .addClass("down");
            active.parent().children().eq(i).removeClass("up").addClass("down");
          }
        }
        active.index() < curr.index()
          ? active
              .parents("section")
              .find(".pagination strong span")
              .eq(active.index())
              .removeClass("active")
              .addClass("up")
          : active
              .parents("section")
              .find(".pagination strong span")
              .eq(active.index())
              .removeClass("active")
              .addClass("down");
        active
          .parents("section")
          .find(".pagination strong span")
          .eq(curr.index())
          .addClass("active")
          .removeClass("up down");
        curr.addClass("active").removeClass("up down");
        if (
          viewport().width <= 768 &&
          curr.parents("section").hasClass("wide-text")
        ) {
          var currH = curr.find("p").data("height");
          active.find("p").css("height", "0px");
          curr.find("p").css("height", currH);
        }
        runningTimeout = setTimeout(function () {
          cf.body.removeClass("switching");
          clearTimeout(runningTimeout);
          runningTimeout = null;
          running = false;
        }, 1600);
      }

      function revealBgr(active, direction) {
        if (!cf.html.hasClass("ie11"))
          multipleSplats(parseInt(Math.random() * 1) + 2);
        running = true;
        cf.body.addClass("switching");
        active.find(".bgr, .holder, .box").css(cf.delaySetter(0));
        if (direction == "down") {
          active.addClass("bgr-revealed");
          $(".side-nav li")
            .eq(active.index())
            .find("a svg ellipse")
            .css({
              strokeDashoffset: 360 - 63 * 0.5,
            });
          if (viewport().width <= 1024) sideNav.addClass("dark");
        } else {
          active.removeClass("bgr-revealed");
          $(".side-nav li").eq(active.index()).find("a svg ellipse").css({
            strokeDashoffset: 360,
          });
          sideNav.removeClass("dark");
        }
        runningTimeout = setTimeout(function () {
          cf.body.removeClass("switching");
          active.find(".bgr, .holder, .box").css({
            "-webkit-transition-delay": "",
            "-moz-transition-delay": "",
            "-ms-transition-delay": "",
            "-o-transition-delay": "",
            "transition-delay": "",
          });
          clearTimeout(runningTimeout);
          runningTimeout = null;
          running = false;
        }, 1600);
      }

      if (cf.device != "mobile" && $(".with-auto-height").length) {
        document.getElementsByClassName("with-auto-height")[0].addEventListener(
          "scroll",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
        document.getElementsByClassName("with-auto-height")[0].addEventListener(
          "mousewheel",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
        document.getElementsByClassName("with-auto-height")[0].addEventListener(
          "touchmove",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
      }

      $(".with-sub-elements .ordered-list li span").click(function () {
        var curr = $(this);
        if (!running && !curr.parent().hasClass("active")) {
          var activeSection = $("section.active");
          movingSubElements(
            activeSection.find(".ordered-list li.active"),
            curr.parent()
          );
        }
      });

      if (cf.device != "mobile" && $(".scrollable").length) {
        document.getElementsByClassName("scrollable")[0].addEventListener(
          "scroll",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
        document.getElementsByClassName("scrollable")[0].addEventListener(
          "mousewheel",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
        document.getElementsByClassName("scrollable")[0].addEventListener(
          "touchmove",
          function (e) {
            if (running) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          },
          { passive: false }
        );
      }
      var timer,
        atTop = true,
        atBottom = false;

      $(window).on("mousewheel wheel", function (e) {
        if (
          !cf.mapViewed &&
          !$(".nav-trigger").hasClass("close-btn") &&
          !cf.popupOpened
        ) {
          var activeSection = $("section.active");
          if (timer) clearTimeout(timer);
          timer = setTimeout(function () {
            $(this).trigger("scrollFinished");
          }, 55);
          if (e.originalEvent.deltaY > 0) {
            if (
              activeSection.index() < section.length - 1 &&
              !running &&
              !cf.navOpened
            ) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() <
                  activeSection.find(".holder").outerHeight() - cf.windowH
              ) {
              } else if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() >=
                  activeSection.find(".holder").outerHeight() - cf.windowH &&
                !atBottom
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection.find(".ordered-list li.active").is(":last-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").next()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                !activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "down");
              } else {
                moving(activeSection, activeSection.next());
              }
            }
          } else {
            if (activeSection.index() > 0 && !running && !cf.navOpened) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() > 0
              ) {
              } else if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() <= 0 &&
                !atTop
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection
                  .find(".ordered-list li.active")
                  .is(":first-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").prev()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "up");
              } else {
                moving(activeSection, activeSection.prev());
              }
            }
          }
          if (
            (activeSection.hasClass("scrollable") ||
              activeSection.hasClass("with-auto-height")) &&
            !running
          )
            atBottom = atTop = false;
        }
      });

      $(window).on("scrollFinished", function () {
        var activeSection = $("section.active");
        if (
          activeSection.hasClass("scrollable") ||
          activeSection.hasClass("with-auto-height")
        ) {
          if (activeSection.scrollTop() <= 0) {
            atBottom = false;
            atTop = true;
          } else if (
            activeSection.scrollTop() >=
            activeSection.find(".holder").outerHeight() - cf.windowH
          ) {
            atBottom = true;
            atTop = false;
          }
        }
      });

      $(document).keydown(function (e) {
        if (!cf.mapViewed && !$(".nav-trigger").hasClass("close-btn")) {
          var activeSection = $("section.active");
          if (
            (e.keyCode == 0 || e.keyCode == 32 || e.keyCode == 40) &&
            !cf.mapViewed &&
            !cf.popupOpened
          ) {
            if (
              activeSection.index() < section.length - 1 &&
              !running &&
              !cf.navOpened
            ) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() <
                  activeSection.find(".holder").outerHeight() - cf.windowH
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection.find(".ordered-list li.active").is(":last-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").next()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                !activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "down");
              } else {
                moving(activeSection, activeSection.next());
              }
            }
          } else if (e.keyCode == 38) {
            if (
              activeSection.index() > 0 &&
              !running &&
              !cf.navOpened &&
              !cf.popupOpened
            ) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() > 0
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection
                  .find(".ordered-list li.active")
                  .is(":first-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").prev()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "up");
              } else {
                moving(activeSection, activeSection.prev());
              }
            }
          }
        }
      });

      //if (!cf.body.hasClass('blog')) {
      cf.body.swipe({
        swipe: function (
          event,
          direction,
          distance,
          duration,
          fingerCount,
          fingerData
        ) {
          var activeSection = $("section.active");
          if (direction == "up") {
            if (
              activeSection.index() < section.length - 1 &&
              !running &&
              !cf.navOpened &&
              !$(".nav-trigger").hasClass("close-btn") &&
              !cf.mapViewed &&
              !cf.popupOpened
            ) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() <
                  activeSection.find(".holder").outerHeight() - cf.windowH
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection.find(".ordered-list li.active").is(":last-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").next()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                !activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "down");
              } else {
                moving(activeSection, activeSection.next());
              }
            }
          } else if (direction == "down") {
            if (
              activeSection.index() > 0 &&
              !running &&
              !cf.navOpened &&
              !$(".nav-trigger").hasClass("close-btn") &&
              !cf.mapViewed &&
              !cf.popupOpened
            ) {
              if (
                (activeSection.hasClass("scrollable") ||
                  activeSection.hasClass("with-auto-height")) &&
                activeSection.scrollTop() > 0
              ) {
              } else if (
                activeSection.hasClass("with-sub-elements") &&
                activeSection.find(".ordered-list li p").length &&
                !activeSection.hasClass("imgs-list") &&
                !activeSection
                  .find(".ordered-list li.active")
                  .is(":first-child")
              ) {
                movingSubElements(
                  activeSection.find(".ordered-list li.active"),
                  activeSection.find(".ordered-list li.active").prev()
                );
              } else if (
                activeSection.hasClass("with-bgr") &&
                activeSection.hasClass("bgr-revealed")
              ) {
                revealBgr(activeSection, "up");
              } else {
                moving(activeSection, activeSection.prev());
              }
            }
          }
        },
      });
      //}

      $(".scroll-indicator").click(function (e) {
        e.preventDefault();
        moving($("section.active"), $("section.active").next());
      });

      sideNav.find("a").click(function (e) {
        e.preventDefault();
        var parent = $(this).parent();
        if (!parent.hasClass("active") && !running) {
          if (cf.mapViewed) {
            section.removeClass("map-viewed");
            $(".hide-map-btn").trigger("click");
          }
          moving($("section.active"), section.eq(parent.index()));
        }
      });

      $(".menu-cta").click(function (e) {
        e.preventDefault();
        //window.location.hash = '#contact';
        $(".nav-trigger, .side-nav li:last-child a").trigger("click");
      });
    },
    resize: function () {
      var prepTimeout = null;

      $(".with-sub-elements").each(function () {
        var curr = $(this),
          isHidden = !curr.hasClass("active") ? true : false;
        if (!curr.hasClass("with-imgs-list")) {
          if (isHidden) curr.show();
          curr.find("p").each(function () {
            var currP = $(this);
            currP
              .css(cf.transitionSetter("none", "", "", ""))
              .removeAttr("style");
            var currH = currP.height();
            currP.attr("data-height", currH);
            if (viewport().width <= 768 && curr.hasClass("wide-text")) {
              currP.parents("li").hasClass("active")
                ? currP.height(currH)
                : currP.height(0);
            } else {
              currP.removeAttr("style");
            }
            prepTimeout = setTimeout(function () {
              currP.css(cf.transitionSetter("", "", "", ""));
              clearTimeout(prepTimeout);
              prepTimeout = null;
            }, 50);
          });
        }
        if (isHidden) curr.hide();
      });

      if (
        $(".with-box.with-bgr").hasClass("active") &&
        $(".with-box.with-bgr.active").hasClass("bgr-revealed") &&
        viewport().width <= 1024
      )
        $(".side-nav").addClass("dark");
    },
  },
  common: {
    outlinedTexts: [],
    animatedOffsets: [],
    parallaxOffsexts: [],
    parallaxPosition: function (element, index) {
      var currSpeed = element.data("speed"),
        siteTopOffset =
          this.parallaxOffsets[index].top < cf.windowH
            ? cf.windowH - this.parallaxOffsets[index].top
            : 0,
        currMovement =
          currSpeed *
          (this.parallaxOffsets[index].top -
            cf.lastDistanceFromTop -
            cf.windowH +
            siteTopOffset);
      if (
        (currSpeed < 0 && currMovement < 0) ||
        (currSpeed > 0 && currMovement > 0)
      )
        currMovement = 0;
      element.css(cf.transformSetter("0px", currMovement + "px", 1, 1));
    },
    inactivityTime: function () {
      window.onmousemove = resetTimer;
      window.onmousedown = resetTimer;
      window.ontouchstart = resetTimer;
      window.onclick = resetTimer;
      window.onkeypress = resetTimer;
      window.onblur = killTimer;
      window.onfocus = resetTimer;
      window.addEventListener("scroll", resetTimer, true);
      window.addEventListener("mousewheel", resetTimer, true);
      window.addEventListener("wheel", resetTimer, true);
      function activateBgr() {
        subtleMultipleSplats(parseInt(Math.random() * 20) + 5);
      }
      function resetTimer() {
        clearInterval(cf.inactivityInterval);
        cf.inactivityInterval = setInterval(activateBgr, 6000);
      }
      function killTimer() {
        clearInterval(cf.inactivityInterval);
      }
    },
    preventOneWordPerRow: function (selector, numWords) {
      var elems = document.querySelectorAll(selector);
      for (var i = 0; i < elems.length; ++i) {
        if (
          !$(elems[i]).parents(".info-box").length &&
          !$(elems[i]).find(".btn").length
        ) {
          var textArray = elems[i].innerHTML.split(" "),
            lastWords = textArray.splice(-numWords, numWords).join("&nbsp;"),
            textMinusLastWords = textArray.join(" ");
          elems[i].innerHTML = textMinusLastWords + " " + lastWords;
        }
      }
    },
    membersSlider: {
      items: null,

      chunkPeopleSlider: function () {
        var slider = this;

        $.fn.chunk = function (size) {
          var arr = [];
          for (var i = 0; i < this.length; i += size) {
            arr.push(this.slice(i, i + size));
          }

          return this.pushStack(arr, "chunk", size);
        };

        if ($(".slider").length || $(".members-list").length) {
          $(".with-sub-elements.smaller-font ol, .members-list").each(
            function () {
              console.log("unwrap");
              var curr = $(this);
              curr.children("li").each(function (i) {
                var currLi = $(this),
                  currIndex = currLi.index() + 1;
                if (!currLi.parents(".members").length)
                  currLi
                    .children()
                    .attr(
                      "title",
                      currIndex < 10 ? "0" + currIndex : currIndex
                    );
              });

              if (curr.parents("section").hasClass("six-items-in-view")) {
                $(".slide li").unwrap();
              } else if (curr.parents("section").hasClass("members")) {
                if (viewport().width > 1024) {
                  $(".slide li").unwrap();
                } else if (viewport().width <= 1024) {
                  $(".slide li").unwrap();
                }
              } else {
                $("slide li").unwrap();
              }
            }
          );

          $(".imgs-list").each(function () {
            var curr = $(this);
            $(".slider li").unwrap();
            curr.children(":first-child").addClass("active");
          });
        }

        $(".with-sub-elements.smaller-font ol, .members-list").each(
          function () {
            console.log("wrap");
            var curr = $(this);
            curr.addClass("slider");
            if (curr.parents("section").find(".filters").length) {
              slider.items = curr.html();
            }
            curr.children("li").each(function (i) {
              var currLi = $(this),
                currIndex = currLi.index() + 1;
              if (!currLi.parents(".members").length)
                currLi
                  .children()
                  .attr("title", currIndex < 10 ? "0" + currIndex : currIndex);
            });
            if (curr.parents("section").hasClass("six-items-in-view")) {
              curr.children("li").chunk(6).wrap('<div class="slide" />');
            } else if (curr.parents("section").hasClass("members")) {
              if (viewport().width > 1024) {
                console.log(10);
                curr.children("li").chunk(10).wrap('<div class="slide" />');
              } else if (viewport().width <= 1024) {
                console.log(6);
                curr.children("li").chunk(6).wrap('<div class="slide" />');
              }
            } else {
              curr.children("li").chunk(3).wrap('<div class="slide" />');
            }
            curr.children(":first-child").addClass("active");
            $(".slide").each(function () {
              $el = $(this);
              var maxHeight = 460;
              var elHeight = $el.height();
              if (elHeight < maxHeight) {
                $el.css("height", `${maxHeight}`);
              }
            });
          }
        );

        $(".imgs-list").each(function () {
          var curr = $(this);
          curr.addClass("slider");
          curr.children("li").chunk(12).wrap('<div class="slide" />');
          curr.children(":first-child").addClass("active");
        });
      },
      init: function () {
        var slider = this;

        this.chunkPeopleSlider();

        $(".slider").each(function () {
          var curr = $(this),
            slides = curr.find(".slide");
          slides.eq(0).addClass("active");
          var currBullets = $('<ul class="bullets" />').insertAfter(curr);
          for (var i = 0; i < curr.find(".slide").length; i++) {
            var currNumb = i + 1;
            i == 0
              ? $('<li class="active">' + currNumb + "</li>").appendTo(
                  currBullets
                )
              : $("<li>" + currNumb + "</li>").appendTo(currBullets);
          }
          if (slides.length < 2) {
            if (curr.parents(".footer-new").length) {
              curr.parents(".footer-new").find(".slider-nav, .bullets").hide();
              curr
                .parents(".footer-new")
                .find(".slider-nav .next")
                .addClass("disabled");
            } else {
              curr.parents("section").find(".slider-nav, .bullets").hide();
              curr
                .parents("section")
                .find(".slider-nav .next")
                .addClass("disabled");
            }
          }
        });

        cf.body.on("click", ".bullets li", function () {
          var curr = $(this);
          if (!curr.hasClass("active")) {
            curr.addClass("active").siblings().removeClass("active");
            if (cf.device != "mobile") {
              var currSlider = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slider")
                  : curr.parents("section").find(".slider"),
                activeSlide = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slide.active")
                  : curr.parents("section").find(".slide.active");
              activeSlide.removeClass("active");
              currSlider.find(".slide").eq(curr.index()).addClass("active");
              if (curr.index() == 0) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .prev")
                  .removeClass("active")
                  .addClass("disabled")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
              } else if (curr.index() == curr.siblings().length) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next")
                  .removeClass("active")
                  .addClass("disabled")
                  .next()
                  .removeClass("disabled")
                  .addClass("active");
              }
            } else if (!isRunning) {
              isRunning = true;
              var currSlider = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slider")
                  : curr.parents("section").find(".slider"),
                activeSlide = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slide.active")
                  : curr.parents("section").find(".slider.active");
              if (curr.index() < activeSlide.index()) {
                activeSlide.css(
                  cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                );
                currSlider
                  .find(".slide")
                  .eq(curr.index())
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(100% + 100px)", "0px", 1, 1)
                  );
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 50);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 550);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 600);
              } else {
                activeSlide.css(
                  cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                );
                currSlider
                  .find(".slide")
                  .eq(curr.index())
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(100% + 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1)
                  );
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 50);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 550);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 600);
              }
              if (curr.index() == 0) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .prev")
                  .removeClass("active")
                  .addClass("disabled")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
              } else if (curr.index() == curr.siblings().length) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next")
                  .removeClass("active")
                  .addClass("disabled")
                  .next()
                  .removeClass("disabled")
                  .addClass("active");
              } else {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next, .slider-nav .prev")
                  .removeClass("disabled");
              }
            }
          }
        });

        $(".slider-nav li.prev").addClass("disabled");
        $(".slider-nav li.next").addClass("active");

        var prepTimeout = null,
          animTimeout = null,
          animFinishedTimeout = null,
          isRunning = false;

        cf.body.on("click", ".slider-nav li a", function (e) {
          e.preventDefault();
          var curr = $(this).parent(),
            currSlider = curr.parents(".footer-new").length
              ? curr.parents(".footer-new").find(".slider")
              : curr.parents("section").find(".slider"),
            activeSlide = curr.parents(".footer-new").length
              ? curr.parents(".footer-new").find(".slide.active")
              : curr.parents("section").find(".slide.active");
          if (!curr.hasClass("disabled")) {
            if (cf.device != "mobile") {
              activeSlide.removeClass("active");
              if (curr.hasClass("prev")) {
                curr
                  .removeClass("active")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                }
                if (activeSlide.index() == 1) {
                  curr.addClass("disabled");
                  $(".cursor").removeClass("over-link");
                }
                activeSlide.prev().addClass("active");
              } else {
                curr.next().removeClass("disabled");
                if (activeSlide.index() == currSlider.children().length - 2) {
                  curr.addClass("disabled").removeClass("active");
                  curr.next().addClass("active");
                  $(".cursor").removeClass("over-link");
                }
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                }
                activeSlide.next().addClass("active");
              }
            } else if (!isRunning) {
              isRunning = true;
              if (curr.hasClass("prev")) {
                curr
                  .removeClass("active")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                }
                if (activeSlide.index() == 1) {
                  curr.addClass("disabled");
                  $(".cursor").removeClass("over-link");
                }
                activeSlide
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .prev()
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(100% + 100px)", "0px", 1, 1)
                  );
                  activeSlide
                    .prev()
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 20);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  activeSlide
                    .prev()
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 520);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  activeSlide.prev().css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 540);
              } else {
                curr.next().removeClass("disabled");
                if (activeSlide.index() == currSlider.children().length - 2) {
                  curr.addClass("disabled").removeClass("active");
                  curr.next().addClass("active");
                  $(".cursor").removeClass("over-link");
                }
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                }
                activeSlide
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .next()
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(100% + 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1)
                  );
                  activeSlide
                    .next()
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 20);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  activeSlide
                    .next()
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 520);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  activeSlide.next().css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 540);
              }
              if (curr.parents(".with-slider").length) {
                currSlider.height(currSlider.find(".active").height());
                $("html, body")
                  .stop()
                  .animate(
                    {
                      scrollTop: curr.parents("section").offset().top - 84,
                    },
                    1000,
                    "easeInOutCubic"
                  );
              }
            }
          }
        });

        $(".slider").swipe({
          swipe: function (
            event,
            direction,
            distance,
            duration,
            fingerCount,
            fingerData
          ) {
            if (direction == "left") {
              $(this).parent().find(".slider-nav li.next a").trigger("click");
            } else if (direction == "right") {
              $(this).parent().find(".slider-nav li.prev a").trigger("click");
            }
          },
        });

        if (cf.device == "desktop") {
          $(".slider-nav li.prev").hover(
            function () {
              $(this).prev().addClass("inactive");
            },
            function () {
              $(this).prev().removeClass("inactive");
            }
          );
        }

        if (cf.device == "mobile") {
          $('<span class="current-filter">All</span>').appendTo(
            ".six-items-in-view h3, .members h3"
          );
          $('<span class="filters-trigger"></span>').prependTo(
            ".six-items-in-view .holder, .members .holder"
          );
          $("body").click(function () {
            if ($(".filters").hasClass("opened"))
              $(".filters").removeClass("opened");
          });
          $(".filters").click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          });
        }

        $(".filters-trigger").click(function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          $(".filters").addClass("opened");
          cf.navOpened = true;
        });

        $(".filters .close-btn").click(function (e) {
          e.preventDefault();
          $(".filters").removeClass("opened");
          cf.navOpened = false;
        });

        var filteringTimeout = null,
          filteringPrepTimeout = null,
          filteringAnimTimeout = null;

        $(".filters li a").click(function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          var curr = $(this),
            currSection = curr.parents("section");
          if (!curr.parent().hasClass("active")) {
            $(".filters li").removeClass("active");
            $(".filters").removeClass("opened");
            curr.parent().addClass("active");
            $(".current-filter").text(curr.text());
            cf.navOpened = false;
            currSection
              .find(".slide")
              .css(cf.delaySetter(0))
              .css("opacity", "0");
            currSection.find(".slider-nav").css("opacity", "0");
            filteringTimeout = setTimeout(function () {
              currSection.find("ol").empty().html(slider.items);
              if (!cf.html.hasClass("ie11")) {
                // currSection.find('.outlined').each(function() {
                //     var curr = $(this),
                //         cloned = curr.clone(true, true);
                //     $(cloned).insertBefore(curr);
                // })
                currSection.find(".outlined text").each(function () {
                  var curr = $(this);
                  if (curr.parents(".cta-btn").length) {
                    var curr = $(this),
                      parent = curr.parents("svg"),
                      fontSize = parent.css("font-size");
                    curr
                      .attr("font-size", Math.ceil(fontSize))
                      .attr("y", Math.ceil(fontSize));
                    parent
                      .width(
                        cf.common.svgWH(
                          curr.context.textContent,
                          Math.ceil(fontSize)
                        ).w * 1.05
                      )
                      .height(
                        cf.common.svgWH(
                          curr.context.textContent,
                          Math.ceil(fontSize)
                        ).h * 1.25
                      );
                  } else {
                    var parent = curr.parents("svg"),
                      fontSize = parent.css("font-size"),
                      isHidden = false;
                    if (curr.parents(".main-nav-holder").is(":hidden")) {
                      isHidden = true;
                      curr.parents(".main-nav-holder").show();
                    }
                    if (!curr.parents("section").hasClass("active")) {
                      isHidden = true;
                      curr.parents("section").show();
                    }
                    var currW =
                      cf.device != "mobile"
                        ? curr.parents(".holder").width() - 50
                        : curr.parents("span").length
                        ? curr.parents("span").width()
                        : curr.parents("a").width();
                    curr.attr("font-size", Math.ceil(parseInt(fontSize)));
                    var div = document.createElement("div");
                    div.style.position = "absolute";
                    div.style.visibility = "hidden";
                    div.style.height = "auto";
                    div.style.width = "auto";
                    div.style.maxWidth = currW + "px";
                    div.style.fontSize = Math.ceil(parseInt(fontSize)) + "px";
                    div.style.fontFamily = "Proxima Nova Bold";
                    div.style.lineHeight =
                      Math.ceil(parseInt(fontSize)) * 1.15 + "px";
                    div.innerHTML =
                      cf.common.outlinedTexts[curr.index(".outlined text")];
                    document.body.appendChild(div);
                    cf.splitLines($(div), Math.ceil(parseInt(fontSize)) * 1.15);
                    curr.html($(div).html());
                    parent.width($(div).width() * 1.05);
                    parent.height($(div).height() * 1.2);
                    document.body.removeChild(div);
                    if (isHidden)
                      curr.parents("section, .main-nav-holder").hide();
                  }
                });
              }

              if (!curr.hasClass("all")) {
                currSection.find("ol li").each(function () {
                  var currItem = $(this);
                  if (currItem.data("filter") != curr.attr("class"))
                    currItem.remove();
                });
              }

              currSection.find("ol").each(function () {
                console.log("unwrap");
                var curr = $(this);
                curr.children("li").each(function (i) {
                  var currLi = $(this),
                    currIndex = currLi.index() + 1;
                  if (!currLi.parents(".members").length)
                    currLi
                      .children()
                      .attr(
                        "title",
                        currIndex < 10 ? "0" + currIndex : currIndex
                      );
                });

                if (curr.parents("section").hasClass("six-items-in-view")) {
                  $(".slide li").unwrap();
                } else if (curr.parents("section").hasClass("members")) {
                  if (viewport().width > 1024) {
                    $(".slide li").unwrap();
                  } else if (viewport().width <= 1024) {
                    $(".slide li").unwrap();
                  }
                } else {
                  $("slide li").unwrap();
                }
              });

              currSection.find("ol").each(function () {
                var curr = $(this);
                curr.children("li").each(function (i) {
                  var currLi = $(this),
                    currIndex = currLi.index() + 1;
                  if (!currLi.parents(".members").length)
                    currLi
                      .children()
                      .attr(
                        "title",
                        currIndex < 10 ? "0" + currIndex : currIndex
                      );
                });
                if (curr.parents("section").hasClass("six-items-in-view")) {
                  curr.children("li").chunk(6).wrap('<div class="slide" />');
                } else if (curr.parents("section").hasClass("members")) {
                  viewport().width > 1024 || viewport().width <= 1024
                    ? curr
                        .children("li")
                        .chunk(10)
                        .wrap('<div class="slide" />')
                    : curr
                        .children("li")
                        .chunk(6)
                        .wrap('<div class="slide" />');
                } else {
                  curr.children("li").chunk(3).wrap('<div class="slide" />');
                }
              });
              currSection.find(".slider").each(function () {
                var curr = $(this),
                  slides = curr.find(".slide");
                slides.length < 2
                  ? curr
                      .parents("section")
                      .find(".slider-nav, .bullets")
                      .hide()
                      .find(".next")
                      .addClass("disabled")
                  : cf.device != "mobile"
                  ? curr
                      .parents("section")
                      .find(".slider-nav")
                      .show()
                      .find(".next")
                      .removeClass("disabled")
                  : curr
                      .parents("section")
                      .find(".bullets")
                      .show()
                      .find(".next")
                      .removeClass("disabled");
              });
              filteringPrepTimeout = setTimeout(function () {
                currSection.find(".slider").each(function () {
                  var curr = $(this),
                    slides = curr.find(".slide");
                  slides.eq(0).css(cf.delaySetter(0)).addClass("active");
                  if (slides.length >= 2)
                    curr
                      .parents("section")
                      .find(".slider-nav")
                      .css("opacity", "1");
                });
                clearTimeout(filteringPrepTimeout);
                filteringPrepTimeout = null;
              }, 10);
              filteringAnimTimeout = setTimeout(function () {
                currSection.find(".slide").removeAttr("style");
                clearTimeout(filteringAnimTimeout);
                filteringAnimTimeout = null;
              }, 510);
              currSection.find(".slider-nav li.prev").addClass("disabled");
              currSection.find(".slider-nav li.next").addClass("active");
              clearTimeout(filteringTimeout);
              filteringTimeout = null;
            }, 500);
          }
        });
      },
      resize: function () {
        $(".slider").each(function () {
          var curr = $(this),
            children = curr.children(),
            maxH = 0,
            isHidden = false;
          curr.css("height", "");
          if (!curr.parents("section").hasClass("active")) {
            isHidden = true;
            curr.parents("section").show();
          }
          children.each(function () {
            var child = $(this);
            if (maxH < child.height()) maxH = child.height();
          });
          cf.device == "mobile" &&
          (curr.parents(".with-slider").length ||
            curr.parents(".footer-new").length)
            ? curr.height(curr.find(".slide.active").height())
            : curr.height(maxH);
          if (isHidden) curr.parents("section").hide();
        });

        $(".with-slider").each(function () {
          var curr = $(this),
            isHidden = false;
          if (curr.is(":hidden")) {
            curr.show();
            isHidden = true;
          }
          curr.css(cf.transitionSetter("none", "", "", ""));
          curr.find(".holder").css(cf.transitionSetter("none", "", "", ""));
          curr.find(".slider").css(cf.transitionSetter("none", "", "", ""));
          curr.find(".slide").css(cf.transitionSetter("none", "", "", ""));
          if (viewport().width > 768) {
            curr.find(".holder").outerHeight() > cf.windowH * 0.65
              ? curr.addClass("with-columns").find(".text-holder").columnize()
              : curr.removeClass("with-columns");
          } else {
            curr.removeClass("with-columns");
          }
          if (isHidden) curr.hide();
          prepTimeout = setTimeout(function () {
            curr.css(cf.transitionSetter("", "", "", ""));
            curr.find(".holder").css(cf.transitionSetter("", "", "", ""));
            curr.find(".slider").css(cf.transitionSetter("", "", "", ""));
            curr.find(".slide").css(cf.transitionSetter("", "", "", ""));
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 50);
        });

        $(".slider").each(function () {
          var curr = $(this),
            children = curr.children(),
            maxH = 0,
            isHidden = false;
          curr.css("height", "");
          if (!curr.parents("section").hasClass("active")) {
            isHidden = true;
            curr.parents("section").show();
          }
          children.each(function () {
            var child = $(this);
            if (maxH < child.height()) maxH = child.height();
          });
          cf.device == "mobile" &&
          (curr.parents(".with-slider").length ||
            curr.parents(".footer-new").length)
            ? curr.height(curr.find(".slide.active").height())
            : curr.height(maxH);
          if (isHidden) curr.parents("section").hide();
        });

        // var membersTitleH = 0;

        // $('.members-list li hgroup').each(function() {
        //     var curr = $(this);
        //     curr.removeAttr('style');
        //     if (curr.height() > membersTitleH) membersTitleH = curr.height();
        // })

        // $('.members-list li hgroup').css('height', membersTitleH)
      },
    },
    slider: {
      init: function () {
        $.fn.chunk = function (size) {
          var arr = [];
          for (var i = 0; i < this.length; i += size) {
            arr.push(this.slice(i, i + size));
          }
          return this.pushStack(arr, "chunk", size);
        };

        var items = null;

        $(".with-sub-elements.smaller-font ol, .members-list").each(
          function () {
            var curr = $(this);
            curr.addClass("slider");
            if (curr.parents("section").find(".filters").length) {
              items = curr.html();
            }
            curr.children("li").each(function (i) {
              var currLi = $(this),
                currIndex = currLi.index() + 1;
              if (!currLi.parents(".members").length)
                currLi
                  .children()
                  .attr("title", currIndex < 10 ? "0" + currIndex : currIndex);
            });
            if (curr.parents("section").hasClass("six-items-in-view")) {
              curr.children("li").chunk(6).wrap('<div class="slide" />');
            } else if (curr.parents("section").hasClass("members")) {
              viewport().width > 1024 || cf.device == "mobile"
                ? curr.children("li").chunk(10).wrap('<div class="slide" />')
                : curr.children("li").chunk(6).wrap('<div class="slide" />');
            } else {
              curr.children("li").chunk(3).wrap('<div class="slide" />');
            }
            curr.children(":first-child").addClass("active");
          }
        );

        $(".imgs-list").each(function () {
          var curr = $(this);
          curr.addClass("slider");
          curr.children("li").chunk(20).wrap('<div class="slide" />'); // ex value : 12
          curr.children(":first-child").addClass("active");
        });

        $(".slider").each(function () {
          var curr = $(this),
            slides = curr.find(".slide");
          slides.eq(0).addClass("active");
          var currBullets = $('<ul class="bullets" />').insertAfter(curr);
          for (var i = 0; i < curr.find(".slide").length; i++) {
            var currNumb = i + 1;
            i == 0
              ? $('<li class="active">' + currNumb + "</li>").appendTo(
                  currBullets
                )
              : $("<li>" + currNumb + "</li>").appendTo(currBullets);
          }
          if (slides.length < 2) {
            curr.parents("section").find(".slider-nav, .bullets").hide();
            curr
              .parents("section")
              .find(".slider-nav .next")
              .addClass("disabled");
          }
        });

        cf.body.on("click", ".bullets li", function () {
          var curr = $(this);
          if (!curr.hasClass("active")) {
            curr.addClass("active").siblings().removeClass("active");
            if (cf.device != "mobile") {
              var currSlider = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slider")
                  : curr.parents("section").find(".slider"),
                activeSlide = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slide.active")
                  : curr.parents("section").find(".slide.active");
              activeSlide.removeClass("active");
              currSlider.find(".slide").eq(curr.index()).addClass("active");
              if (curr.index() == 0) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .prev")
                  .removeClass("active")
                  .addClass("disabled")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
              } else if (curr.index() == curr.siblings().length) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next")
                  .removeClass("active")
                  .addClass("disabled")
                  .next()
                  .removeClass("disabled")
                  .addClass("active");
              }
            } else if (!isRunning) {
              isRunning = true;
              var currSlider = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slider")
                  : curr.parents("section").find(".slider"),
                activeSlide = curr.parents(".footer-new").length
                  ? curr.parents(".footer-new").find(".slide.active")
                  : curr.parents("section").find(".slide.active");
              if (curr.index() < activeSlide.index()) {
                activeSlide.css(
                  cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                );
                currSlider
                  .find(".slide")
                  .eq(curr.index())
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                currSlider
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .height(currSlider.find(".slide").eq(curr.index()).height());
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(100% + 100px)", "0px", 1, 1)
                  );
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 50);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 550);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 600);
              } else {
                activeSlide.css(
                  cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                );
                currSlider
                  .find(".slide")
                  .eq(curr.index())
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(100% + 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                currSlider
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .height(currSlider.find(".slide").eq(curr.index()).height());
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1)
                  );
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 50);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 550);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  currSlider
                    .find(".slide")
                    .eq(curr.index())
                    .css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 600);
              }
              if (curr.index() == 0) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .prev")
                  .removeClass("active")
                  .addClass("disabled")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
              } else if (curr.index() == curr.siblings().length) {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next")
                  .removeClass("active")
                  .addClass("disabled")
                  .next()
                  .removeClass("disabled")
                  .addClass("active");
              } else {
                curr
                  .parent()
                  .parent()
                  .find(".slider-nav .next, .slider-nav .prev")
                  .removeClass("disabled");
              }
            }
          }
        });

        $(".slider-nav li.prev").addClass("disabled");
        $(".slider-nav li.next").addClass("active");

        var prepTimeout = null,
          animTimeout = null,
          animFinishedTimeout = null,
          isRunning = false;

        cf.body.on("click", ".slider-nav li a", function (e) {
          e.preventDefault();
          var curr = $(this).parent(),
            currSlider = curr.parents(".footer-new").length
              ? curr.parents(".footer-new").find(".slider")
              : curr.parents("section").find(".slider"),
            activeSlide = curr.parents(".footer-new").length
              ? curr.parents(".footer-new").find(".slide.active")
              : curr.parents("section").find(".slide.active");
          if (!curr.hasClass("disabled")) {
            if (cf.device != "mobile") {
              activeSlide.removeClass("active");
              if (curr.hasClass("prev")) {
                curr
                  .removeClass("active")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                }
                if (activeSlide.index() == 1) {
                  curr.addClass("disabled");
                  $(".cursor").removeClass("over-link");
                }
                activeSlide.prev().addClass("active");
              } else {
                curr.next().removeClass("disabled");
                if (activeSlide.index() == currSlider.children().length - 2) {
                  curr.addClass("disabled").removeClass("active");
                  curr.next().addClass("active");
                  $(".cursor").removeClass("over-link");
                }
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                }
                activeSlide.next().addClass("active");
              }
            } else if (!isRunning) {
              isRunning = true;
              if (curr.hasClass("prev")) {
                curr
                  .removeClass("active")
                  .prev()
                  .removeClass("disabled")
                  .addClass("active");
                currSlider
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .height(activeSlide.prev().height());
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .prev()
                    .addClass("active");
                }
                if (activeSlide.index() == 1) {
                  curr.addClass("disabled");
                  $(".cursor").removeClass("over-link");
                }
                activeSlide
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .prev()
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(100% + 100px)", "0px", 1, 1)
                  );
                  activeSlide
                    .prev()
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 20);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  activeSlide
                    .prev()
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 520);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  activeSlide.prev().css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 540);
              } else {
                curr.next().removeClass("disabled");
                currSlider
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .height(activeSlide.next().height());
                if (activeSlide.index() == currSlider.children().length - 2) {
                  curr.addClass("disabled").removeClass("active");
                  curr.next().addClass("active");
                  $(".cursor").removeClass("over-link");
                }
                if (curr.parents(".footer-new").length) {
                  curr
                    .parents(".footer-new")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                } else {
                  curr
                    .parents("section")
                    .find(".bullets li.active")
                    .removeClass("active")
                    .next()
                    .addClass("active");
                }
                activeSlide
                  .css(
                    cf.transitionSetter("all", "500ms", "0ms", "ease-in-out")
                  )
                  .next()
                  .css(cf.transitionSetter("none", "", "", ""))
                  .css(cf.transformSetter("calc(100% + 100px)", "0px", 1, 1))
                  .css("opacity", "1");
                prepTimeout = setTimeout(function () {
                  activeSlide.css(
                    cf.transformSetter("calc(-100% - 100px)", "0px", 1, 1)
                  );
                  activeSlide
                    .next()
                    .css(cf.transitionSetter("", "", "", ""))
                    .css(cf.transformSetter("0px", "0px", 1, 1));
                  clearTimeout(prepTimeout);
                  prepTimeout = null;
                }, 20);
                animTimeout = setTimeout(function () {
                  activeSlide
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .removeClass("active");
                  activeSlide
                    .next()
                    .css(cf.transitionSetter("none", "", "", ""))
                    .css(cf.transformSetter("", "", "", ""))
                    .css("opacity", "")
                    .addClass("active");
                  clearTimeout(animTimeout);
                  animTimeout = null;
                }, 520);
                animFinishedTimeout = setTimeout(function () {
                  activeSlide.css(cf.transitionSetter("", "", "", ""));
                  activeSlide.next().css(cf.transitionSetter("", "", "", ""));
                  isRunning = false;
                  clearTimeout(animFinishedTimeout);
                  animFinishedTimeout = null;
                }, 540);
              }
              if (curr.parents(".with-slider").length) {
                //currSlider.height(currSlider.find('.active').height());
                $("html, body")
                  .stop()
                  .animate(
                    {
                      scrollTop: curr.parents("section").offset().top - 84,
                    },
                    1000,
                    "easeInOutCubic"
                  );
              }
            }
          }
        });

        $(".slider").swipe({
          swipe: function (
            event,
            direction,
            distance,
            duration,
            fingerCount,
            fingerData
          ) {
            if (direction == "left") {
              $(this).parent().find(".slider-nav li.next a").trigger("click");
            } else if (direction == "right") {
              $(this).parent().find(".slider-nav li.prev a").trigger("click");
            }
          },
        });

        if (cf.device == "desktop") {
          $(".slider-nav li.prev").hover(
            function () {
              $(this).prev().addClass("inactive");
            },
            function () {
              $(this).prev().removeClass("inactive");
            }
          );
        }

        if (cf.device == "mobile") {
          $('<span class="current-filter">All</span>').appendTo(
            ".six-items-in-view h3, .members h3"
          );
          $('<span class="filters-trigger"></span>').prependTo(
            ".six-items-in-view .holder, .members .holder"
          );
          $("body").click(function () {
            if ($(".filters").hasClass("opened"))
              $(".filters").removeClass("opened");
          });
          $(".filters").click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          });
        }

        $(".filters-trigger").click(function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          $(".filters").addClass("opened");
          cf.navOpened = true;
        });

        $(".filters .close-btn").click(function (e) {
          e.preventDefault();
          $(".filters").removeClass("opened");
          cf.navOpened = false;
        });

        var filteringTimeout = null,
          filteringPrepTimeout = null,
          filteringAnimTimeout = null;

        $(".filters li a").click(function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          var curr = $(this),
            currSection = curr.parents("section");
          if (!curr.parent().hasClass("active")) {
            $(".filters li").removeClass("active");
            $(".filters").removeClass("opened");
            curr.parent().addClass("active");
            $(".current-filter").text(curr.text());
            cf.navOpened = false;
            currSection
              .find(".slide")
              .css(cf.delaySetter(0))
              .css("opacity", "0");
            currSection.find(".slider-nav").css("opacity", "0");
            filteringTimeout = setTimeout(function () {
              currSection.find("ol").empty().html(items);
              if (!cf.html.hasClass("ie11")) {
                // currSection.find('.outlined').each(function() {
                //     var curr = $(this),
                //         cloned = curr.clone(true, true);
                //     $(cloned).insertBefore(curr);
                // })
                currSection.find(".outlined text").each(function () {
                  var curr = $(this);
                  if (curr.parents(".cta-btn").length) {
                    var curr = $(this),
                      parent = curr.parents("svg"),
                      fontSize = parent.css("font-size");
                    curr
                      .attr("font-size", Math.ceil(fontSize))
                      .attr("y", Math.ceil(fontSize));
                    parent
                      .width(
                        cf.common.svgWH(
                          curr.context.textContent,
                          Math.ceil(fontSize)
                        ).w * 1.05
                      )
                      .height(
                        cf.common.svgWH(
                          curr.context.textContent,
                          Math.ceil(fontSize)
                        ).h * 1.25
                      );
                  } else {
                    var parent = curr.parents("svg"),
                      fontSize = parent.css("font-size"),
                      isHidden = false;
                    if (curr.parents(".main-nav-holder").is(":hidden")) {
                      isHidden = true;
                      curr.parents(".main-nav-holder").show();
                    }
                    if (!curr.parents("section").hasClass("active")) {
                      isHidden = true;
                      curr.parents("section").show();
                    }
                    var currW =
                      cf.device != "mobile"
                        ? curr.parents(".holder").width() - 50
                        : curr.parents("span").length
                        ? curr.parents("span").width()
                        : curr.parents("a").width();
                    curr.attr("font-size", Math.ceil(parseInt(fontSize)));
                    var div = document.createElement("div");
                    div.style.position = "absolute";
                    div.style.visibility = "hidden";
                    div.style.height = "auto";
                    div.style.width = "auto";
                    div.style.maxWidth = currW + "px";
                    div.style.fontSize = Math.ceil(parseInt(fontSize)) + "px";
                    div.style.fontFamily = "Proxima Nova Bold";
                    div.style.lineHeight =
                      Math.ceil(parseInt(fontSize)) * 1.15 + "px";
                    div.innerHTML =
                      cf.common.outlinedTexts[curr.index(".outlined text")];
                    document.body.appendChild(div);
                    cf.splitLines($(div), Math.ceil(parseInt(fontSize)) * 1.15);
                    curr.html($(div).html());
                    parent.width($(div).width() * 1.05);
                    parent.height($(div).height() * 1.2);
                    document.body.removeChild(div);
                    if (isHidden)
                      curr.parents("section, .main-nav-holder").hide();
                  }
                });
              }

              if (!curr.hasClass("all")) {
                currSection.find("ol li").each(function () {
                  var currItem = $(this);
                  if (currItem.data("filter") != curr.attr("class"))
                    currItem.remove();
                });
              }
              currSection.find("ol").each(function () {
                var curr = $(this);
                curr.children("li").each(function (i) {
                  var currLi = $(this),
                    currIndex = currLi.index() + 1;
                  if (!currLi.parents(".members").length)
                    currLi
                      .children()
                      .attr(
                        "title",
                        currIndex < 10 ? "0" + currIndex : currIndex
                      );
                });
                if (curr.parents("section").hasClass("six-items-in-view")) {
                  curr.children("li").chunk(6).wrap('<div class="slide" />');
                } else if (curr.parents("section").hasClass("members")) {
                  viewport().width > 1024 || cf.device == "mobile"
                    ? curr
                        .children("li")
                        .chunk(10)
                        .wrap('<div class="slide" />')
                    : curr
                        .children("li")
                        .chunk(6)
                        .wrap('<div class="slide" />');
                } else {
                  curr.children("li").chunk(3).wrap('<div class="slide" />');
                }
              });
              currSection.find(".slider").each(function () {
                var curr = $(this),
                  slides = curr.find(".slide");
                slides.length < 2
                  ? curr
                      .parents("section")
                      .find(".slider-nav, .bullets")
                      .hide()
                      .find(".next")
                      .addClass("disabled")
                  : cf.device != "mobile"
                  ? curr
                      .parents("section")
                      .find(".slider-nav")
                      .show()
                      .find(".next")
                      .removeClass("disabled")
                  : curr
                      .parents("section")
                      .find(".bullets")
                      .show()
                      .find(".next")
                      .removeClass("disabled");
              });
              filteringPrepTimeout = setTimeout(function () {
                currSection.find(".slider").each(function () {
                  var curr = $(this),
                    slides = curr.find(".slide");
                  slides.eq(0).css(cf.delaySetter(0)).addClass("active");
                  if (slides.length >= 2)
                    curr
                      .parents("section")
                      .find(".slider-nav")
                      .css("opacity", "1");
                });
                clearTimeout(filteringPrepTimeout);
                filteringPrepTimeout = null;
              }, 10);
              filteringAnimTimeout = setTimeout(function () {
                currSection.find(".slide").removeAttr("style");
                clearTimeout(filteringAnimTimeout);
                filteringAnimTimeout = null;
              }, 510);
              currSection.find(".slider-nav li.prev").addClass("disabled");
              currSection.find(".slider-nav li.next").addClass("active");
              clearTimeout(filteringTimeout);
              filteringTimeout = null;
            }, 500);
          }
        });
      },
      resize: function () {
        $(".slider").each(function () {
          var curr = $(this),
            children = curr.children(),
            maxH = 0,
            isHidden = false;
          curr.css("height", "");
          if (!curr.parents("section").hasClass("active")) {
            isHidden = true;
            curr.parents("section").show();
          }
          children.each(function () {
            var child = $(this);
            if (maxH < child.height()) maxH = child.height();
          });
          cf.device == "mobile" &&
          (curr.parents(".with-slider").length ||
            curr.parents(".footer-new").length)
            ? curr.height(curr.find(".slide.active").height())
            : curr.height(maxH);
          if (isHidden) curr.parents("section").hide();
        });

        $(".with-slider").each(function () {
          var curr = $(this),
            isHidden = false;
          if (curr.is(":hidden")) {
            curr.show();
            isHidden = true;
          }
          curr.css(cf.transitionSetter("none", "", "", ""));
          curr.find(".holder").css(cf.transitionSetter("none", "", "", ""));
          curr.find(".slider").css(cf.transitionSetter("none", "", "", ""));
          curr.find(".slide").css(cf.transitionSetter("none", "", "", ""));
          if (viewport().width > 768) {
            curr.find(".holder").outerHeight() > cf.windowH * 0.65
              ? curr.addClass("with-columns").find(".text-holder").columnize()
              : curr.removeClass("with-columns");
          } else {
            curr.removeClass("with-columns");
          }
          if (isHidden) curr.hide();
          prepTimeout = setTimeout(function () {
            curr.css(cf.transitionSetter("", "", "", ""));
            curr.find(".holder").css(cf.transitionSetter("", "", "", ""));
            curr.find(".slider").css(cf.transitionSetter("", "", "", ""));
            curr.find(".slide").css(cf.transitionSetter("", "", "", ""));
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 50);
        });

        $(".slider").each(function () {
          var curr = $(this),
            children = curr.children(),
            maxH = 0,
            isHidden = false;
          curr.css("height", "");
          if (!curr.parents("section").hasClass("active")) {
            isHidden = true;
            curr.parents("section").show();
          }
          children.each(function () {
            var child = $(this);
            if (maxH < child.height()) maxH = child.height();
          });
          cf.device == "mobile" &&
          (curr.parents(".with-slider").length ||
            curr.parents(".footer-new").length)
            ? curr.height(curr.find(".slide.active").height())
            : curr.height(maxH);
          if (isHidden) curr.parents("section").hide();
        });
      },
    },
    svgWH: function (text, size) {
      var div = document.createElement("div");
      div.style.position = "absolute";
      div.style.visibility = "hidden";
      div.style.height = "auto";
      div.style.width = "auto";
      div.style.whiteSpace = "nowrap";
      div.style.fontSize = size;
      div.style.lineHeight = size;
      div.innerHTML = text;
      document.body.appendChild(div);
      var dimesions = {
        w: div.clientWidth,
        h: div.clientHeight,
      };
      document.body.removeChild(div);
      return dimesions;
    },
    map: {
      mapOptions: {},
      map: null,
      init: function () {
        this.mapOptions = {
          zoom: 14,
          center: new google.maps.LatLng(38.78609, -77.01528),
          disableDefaultUI: true,
          styles: [
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [
                {
                  saturation: 36,
                },
                {
                  color: "#000000",
                },
                {
                  lightness: 40,
                },
              ],
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [
                {
                  visibility: "on",
                },
                {
                  color: "#000000",
                },
                {
                  lightness: 16,
                },
              ],
            },
            {
              featureType: "all",
              elementType: "labels.icon",
              stylers: [
                {
                  visibility: "off",
                },
              ],
            },
            {
              featureType: "administrative",
              elementType: "geometry.fill",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 20,
                },
              ],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 17,
                },
                {
                  weight: 1.2,
                },
              ],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 20,
                },
              ],
            },
            {
              featureType: "landscape.man_made",
              elementType: "geometry.fill",
              stylers: [
                {
                  color: "#090b0e",
                },
              ],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 21,
                },
              ],
            },
            {
              featureType: "poi.park",
              elementType: "geometry.fill",
              stylers: [
                {
                  color: "#353535",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "all",
              stylers: [
                {
                  visibility: "on",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.fill",
              stylers: [
                {
                  color: "#0cc3fb",
                },
                {
                  lightness: 17,
                },
                {
                  weight: "0.85",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [
                {
                  color: "#f380f9",
                },
                {
                  lightness: 29,
                },
                {
                  weight: "0.85",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "labels.icon",
              stylers: [
                {
                  visibility: "off",
                },
              ],
            },
            {
              featureType: "road.arterial",
              elementType: "all",
              stylers: [
                {
                  weight: "0",
                },
                {
                  visibility: "off",
                },
              ],
            },
            {
              featureType: "road.arterial",
              elementType: "geometry",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 18,
                },
              ],
            },
            {
              featureType: "road.arterial",
              elementType: "geometry.stroke",
              stylers: [
                {
                  weight: "1",
                },
              ],
            },
            {
              featureType: "road.local",
              elementType: "all",
              stylers: [
                {
                  visibility: "simplified",
                },
                {
                  weight: "0",
                },
              ],
            },
            {
              featureType: "road.local",
              elementType: "geometry",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 16,
                },
              ],
            },
            {
              featureType: "road.local",
              elementType: "geometry.fill",
              stylers: [
                {
                  weight: "0",
                },
              ],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [
                {
                  color: "#000000",
                },
                {
                  lightness: 19,
                },
              ],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [
                {
                  color: "#0f252e",
                },
                {
                  lightness: 17,
                },
              ],
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [
                {
                  color: "#4b4b4b",
                },
              ],
            },
          ],
        };
        var mapElement = document.getElementById("map");
        this.map = new google.maps.Map(mapElement, cf.common.map.mapOptions);
        var marker = new google.maps.Marker({
          map: cf.common.map.map,
          position: cf.common.map.map.getCenter(),
          icon: {
            url: themeUrl + "/assets/img/pin.png",
            size: new google.maps.Size(33, 44),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16.5, 22),
          },
        });

        var mapPrepTimeout = null,
          mapRunningTimeout = null,
          hideMapBtn = $(".hide-map-btn");

        $(".view-map-btn").click(function (e) {
          e.preventDefault();
          var curr = $(this);
          curr.parents("section").addClass("map-viewed");
          $(".side-nav").css("opacity", "0");
          if (cf.device == "mobile") $(".nav-trigger").addClass("close-btn");
          cf.body.addClass("header-up");
          cf.common.map.map.setCenterWithOffset(
            cf.common.map.mapOptions.center,
            0,
            0
          );
          prepTimeout = setTimeout(function () {
            $(".side-nav").hide();
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 1000);
          cf.mapViewed = true;
          if (cf.device == "mobile") {
            $("html, body")
              .stop()
              .animate(
                {
                  scrollTop:
                    curr.parents("section").offset().top +
                    curr.parents("section").height() / 2 -
                    cf.windowH / 2,
                },
                1000,
                "easeOutCubic"
              );
            cf.body.addClass("sticky-header").removeClass("header-up");
          }
        });
      },
      resize: function () {
        cf.mapViewed
          ? this.map.setCenterWithOffset(cf.common.map.mapOptions.center, 0, 0)
          : this.map.setCenterWithOffset(
              cf.common.map.mapOptions.center,
              -cf.windowW / 2.5,
              0
            );
      },
    },
    init: function () {
      var self = this;

      /*
            + Create side navigation */

      if (cf.device != "mobile") {
        var sideNav = $('<ul class="side-nav" />').insertAfter(
            "#sections-holder"
          ),
          section = $("section");
        if (section.length > 1) {
          for (var i = 0; i < section.length; i++) {
            $(
              "<li>" +
                '<a href="#">' +
                '<svg class="circle" xmlns="http://www.w3.org/2000/svg">' +
                "<g>" +
                '<ellipse ry="10" rx="10" cy="14" cx="14" stroke-width="2"></ellipse>' +
                "</g>" +
                "</svg>" +
                "</a>" +
                "</li>"
            ).appendTo(sideNav);
          }
        }
        sideNav.children("li:first-child").addClass("active");
      }

      /*
            + Create main navigation - REMOVE FOR NOW

                $('<ul class="desktop-main-nav" />').appendTo('header');
                $('.main-nav .ordered-list li').each(function() {
                    var curr = $(this),
                        cloned = curr.clone(true, true);
                    cloned.appendTo('.desktop-main-nav');
                })

                var clonedContactBtn = $('.main-nav .menu-cta').clone(true, true);
                clonedContactBtn.appendTo('.desktop-main-nav')

                $('.desktop-main-nav a').each(function() {
                    var curr = $(this),
                        currText = curr.text();
                    if (curr.hasClass('menu-cta')) {
                        curr.removeClass('menu-cta').wrap('<li />');
                    }
                    curr.empty().text(currText);
                }) */

      /*
            + Free assessment hash */

      $('a[href="#reach-out"]').click(function (e) {
        e.preventDefault();
        $("html, body")
          .stop()
          .animate(
            {
              scrollTop: $("#reach-out").offset().top,
            },
            2000,
            "easeInOutCubic"
          );
        window.location.hash = "reach-out";
      });

      /*
            + Footer navigation functionality */

      $(".footer .middle a").each(function () {
        var curr = $(this),
          currText = curr.text();
        curr.wrapInner('<span><i data-title="' + currText + '" /></span>');
      });

      $(".footer-nav li a").click(function (e) {
        var curr = $(this),
          currUri = curr.attr("href").split("#")[0],
          currHash = curr.attr("href").split("#")[1],
          uri = window.location.href.split("#")[0];
        if (currUri == uri) {
          e.preventDefault();
          if (currHash != undefined) {
            var currSection = $('section[data-hash="' + currHash + '"]');
            cf.device != "mobile"
              ? $(".side-nav")
                  .children()
                  .eq(currSection.index())
                  .find("a")
                  .trigger("click")
              : $("html, body")
                  .stop()
                  .animate(
                    { scrollTop: currSection.offset().top - 84 },
                    2000,
                    "easeInOutCubic"
                  );
          } else {
            cf.device != "mobile"
              ? $(".side-nav").children().eq(0).find("a").trigger("click")
              : $("html, body")
                  .stop()
                  .animate({ scrollTop: "0" }, 2000, "easeInOutCubic");
          }
        }
      });

      /*
            + Building simple section */

      $('.simple:not(".with-form, .with-columned-list")').each(function () {
        var curr = $(this);
        curr
          .find("p")
          .wrapAll(
            '<div class="text-wrapper"><div class="text-holder" /></div>'
          );
      });

      $(".simple.with-form").each(function () {
        var curr = $(this);
        curr
          .find(".holder > article")
          .children()
          .unwrap()
          .wrapAll('<div class="inner-holder" />');
      });

      /*
            + Building section with box */

      //$('.simple.with-columned-list article').children('ul').unwrap().unwrap();

      $(
        '<ul class="slider-nav">' +
          '<li class="next"><a href="#" class="btn"><span><i data-title="Show More">Show More</i></span></a></li>' +
          '<li class="prev"><a href="#" class="btn"><span><i data-title="Go back">Go back</i></span></a></li>' +
          "</ul> "
      ).appendTo(".simple.with-columned-list article");

      /*
            + Building section with ordered list */

      $(".six-items-in-view").find("article").children().unwrap();

      /*
            + Building anchors */

      $(".footer .navs ul li a, .info-box ul li a").each(function () {
        var curr = $(this),
          text = curr.text();
        curr.wrapInner('<span><i data-title="' + text + '" /></span>');
      });

      /*
            + Adding transition delays to elements */

      $("article").each(function () {
        var children = $(this).children();
        for (var i = 0, j = 0; i < children.length; i++, j += 100) {
          var curr = $(this);
          curr.parents(".simple").length
            ? children.eq(i).attr("data-delay-up", j)
            : children.eq(i).attr("data-delay-up", j);
          children.eq(i).attr("data-delay-anim-up", j + 450);
          if (curr.parents(".hero").length) {
            children.eq(i).css(cf.delaySetter(j));
          }
        }
        for (var i = children.length - 1, j = 0; i >= 0; i--, j += 100) {
          children.eq(i).attr("data-delay-down", j);
          children.eq(i).attr("data-delay-anim-down", j + 450);
        }
      });

      $(".simple form").each(function () {
        var children = $(this).children();
        for (var i = 0, j = 0; i < children.length; i++, j += 100) {
          var curr = $(this);
          curr.parents(".simple").length
            ? children.eq(i).attr("data-delay-up", j)
            : children.eq(i).attr("data-delay-up", j);
          children.eq(i).attr("data-delay-anim-up", j + 450);
          if (curr.parents(".hero").length) {
            children.eq(i).css(cf.delaySetter(j));
          }
        }
        for (var i = children.length - 1, j = 0; i >= 0; i--, j += 100) {
          children.eq(i).attr("data-delay-down", j);
          children.eq(i).attr("data-delay-anim-down", j + 450);
        }
      });

      /*
            + Prevent one word per row */

      this.preventOneWordPerRow("#sections-holder p", 2);

      /*
            + Create slider from list */

      if (cf.device != "mobile") {
        $(
          '.with-columned-list article > ul:not(".slider-nav, .bullets")'
        ).addClass("slider");
        var li = $(
          '.with-columned-list article > ul:not(".slider-nav, .bullets") > li'
        );
        for (var i = 0; i < li.length; i += 2) {
          li.slice(i, i + 2).wrapAll('<div class="slide"></div>');
        }
      } else {
        $(
          '.with-columned-list article > ul:not(".slider-nav, .bullets")'
        ).addClass("slider");
        var li = $(
          '.with-columned-list article > ul:not(".slider-nav, .bullets") > li'
        );
        for (var i = 0; i < li.length; i += 1) {
          li.slice(i, i + 1).wrapAll('<div class="slide"></div>');
        }
      }

      /*
            + SVG | cloning elements */

      if (!cf.html.hasClass("ie11")) {
        $(".outlined").each(function () {
          var curr = $(this),
            cloned = curr.clone(true, true);
          $(cloned).insertBefore(curr);
        });
      }

      /*
            + Pushing outline texts to an array */

      $(".outlined text").each(function () {
        var curr = $(this);
        cf.common.outlinedTexts.push(curr.text());
      });

      /*
            + Call slider functionality */

      //var sliderInitTimeout = null;

      if (
        $(".slider").length ||
        $(".with-sub-elements.smaller-font").length ||
        $(".members-list").length
      ) {
        //sliderInitTimeout = setTimeout(function() {
        $(".members-list").length
          ? self.membersSlider.init()
          : self.slider.init();
        //clearTimeout(sliderInitTimeout);
        //sliderInitTimeout = null;
        //}, 1500);
      }

      /*
            + Main navigation toggle */

      var navHolder = $(".main-nav-holder"),
        stateTimeout = null,
        mapPrepTimeout = null,
        mapAnimTimeout = null;

      $(".close-map-btn").click(function (e) {
        e.preventDefault();
        $(".view-map-btn").parents("section").removeClass("map-viewed");
        $(".side-nav").show();
        cf.body.removeClass("header-up");
        mapPrepTimeout = setTimeout(function () {
          $(".side-nav").css("opacity", "1");
          clearTimeout(mapPrepTimeout);
          mapPrepTimeout = null;
        }, 50);
        mapAnimTimeout = setTimeout(function () {
          cf.mapViewed = false;
          clearTimeout(mapAnimTimeout);
          mapAnimTimeout = null;
        }, 1000);
      });

      $(".nav-trigger").click(function (e) {
        e.preventDefault();
        if ($(this).hasClass("close-btn")) {
          if (cf.mapViewed) {
            $(".view-map-btn").parents("section").removeClass("map-viewed");
            $(".side-nav").show();
            $(".nav-trigger").removeClass("close-btn");
            mapPrepTimeout = setTimeout(function () {
              $(".side-nav").css("opacity", "1");
              clearTimeout(mapPrepTimeout);
              mapPrepTimeout = null;
            }, 50);
            mapAnimTimeout = setTimeout(function () {
              cf.mapViewed = false;
              clearTimeout(mapAnimTimeout);
              mapAnimTimeout = null;
            }, 1000);
          } else {
            $.fancybox.getInstance().close();
          }
        } else {
          if (stateTimeout != null) {
            clearTimeout(stateTimeout);
            stateTimeout = null;
          }
          if (!cf.navOpened) {
            cf.navOpened = true;
            navHolder.show();
            stateTimeout = setTimeout(function () {
              cf.body.addClass("nav-opened");
              clearTimeout(stateTimeout);
              stateTimeout = null;
            }, 50);
          } else {
            $(this).removeClass("close");
            cf.navOpened = false;
            cf.body.removeClass("nav-opened");
            stateTimeout = setTimeout(function () {
              navHolder.hide();
              clearTimeout(stateTimeout);
              stateTimeout = null;
            }, 1000);
          }
        }
      });

      /*
            + Prevent scrolling */

      window.addEventListener(
        "scroll",
        function (e) {
          if (
            (cf.html.hasClass("landscape") && cf.device == "mobile") ||
            cf.navOpened
          ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        },
        { passive: false }
      );
      window.addEventListener(
        "mousewheel",
        function (e) {
          if (
            (cf.html.hasClass("landscape") && cf.device == "mobile") ||
            cf.navOpened
          ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        },
        { passive: false }
      );
      window.addEventListener(
        "touchmove",
        function (e) {
          if (
            (cf.html.hasClass("landscape") && cf.device == "mobile") ||
            cf.navOpened
          ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        },
        { passive: false }
      );

      /*
            + Accordion functionality */

      $(".accordion li > a").click(function (e) {
        e.preventDefault();
        var curr = $(this);
        curr
          .next()
          .slideToggle(500, "easeInOutCubic")
          .parent()
          .toggleClass("active");
      });

      /*
            + Popup functionality */

      cf.body.on("click", ".faq-btn", function (e) {
        e.preventDefault();
        $(".popup-wrapper").addClass("opened");
        cf.currPopupOffset = $(".popup-wrapper .popup-holder").scrollTop();
        if (cf.device != "mobile")
          setTimeout(function () {
            $("header").addClass("dark");
          }, 500);
        cf.body.removeClass("header-up").addClass("sticky-header");
        cf.popupOpened = true;
      });

      var preventTimeout = null,
        prevented = false;

      cf.body.on("click", ".members-list li a", function (e) {
        e.preventDefault();
        var curr = $(this),
          currIndex = curr.parent().data("hash");
        if (!prevented) {
          prevented = true;
          preventTimeout = setTimeout(
            function () {
              window.location.hash = curr.parent().data("hash");
              $("#" + currIndex).addClass("opened");
              cf.currPopupOffset = $("#" + currIndex)
                .find(".popup-holder")
                .scrollTop();
              if (cf.device != "mobile")
                $("header").addClass("dark").addClass("members-popup-opened");
              cf.body.removeClass("header-up").addClass("sticky-header");
              cf.popupOpened = true;
              prevented = false;
              clearTimeout(preventTimeout);
              preventTimeout = null;
            },
            cf.device == "desktop" ? 0 : 1000
          );
        }
      });

      $(".popup-wrapper .back-btn").click(function (e) {
        e.preventDefault();
        $(".popup-wrapper").removeClass("opened");
        if ($("section.active").data("header-color") == "light")
          $("header").removeClass("dark");
        $("header").removeClass("members-popup-opened");
        cf.popupOpened = false;
        window.location.hash = "";
        if ($(window).scrollTop() == 0) cf.body.removeClass("sticky-header");
      });

      /*
            + Focus/ blur form's elements */

      $("input")
        .focus(function () {
          $(this).parents("li").addClass("focused").removeClass("filled");
        })
        .blur(function () {
          !$(this).val()
            ? $(this).parents("li").removeClass("focused").removeClass("filled")
            : $(this).parents("li").addClass("filled").removeClass("focused");
        });

      /*
            + Contact form callbacks */

      if ($(".wpcf").length) {
        var wpcf7Form = document.querySelector(".wpcf7");

        wpcf7Form.addEventListener(
          "wpcf7invalid",
          function (event) {
            $(".wpcf7 ul li").removeClass("with-error");
            $(".wpcf7-not-valid-tip").parents("li").addClass("with-error");
          },
          false
        );

        wpcf7Form.addEventListener(
          "wpcf7submit wpcf7mailsent wpcf7mailfailed",
          function (event) {
            $(".wpcf7 ul li").removeClass("with-error");
          },
          false
        );
      }

      $("#file").change(function () {
        $(".file-info").text(this.files[0].name);
      });

      /*
            + Contact form source selection */

      /*$('#select-source').change(function(){
					if($('#select-source').val() == 'Other') {
						$('.hide-field').show();
						$('.select-source-outer').hide();
					}
				});
				$('#select-source').select2({
					placeholder: 'How did you hear about us?',
					minimumResultsForSearch: Infinity,
					dropdownAutoWidth: true,
					width: 'auto'
				});*/

      $("#select-source").niceSelect();
      $("#select-source").change(function () {
        if ($("#select-source").val() == "Other") {
          $(".select-source-outer").addClass("fade");
          $(".hide-field").addClass("appear");
          setTimeout(function () {
            $(".hide-field input").val("").focus();
          }, 10);
        } else {
          $(".select-source-outer").removeClass("fade");
          $(".hide-field").removeClass("appear");
        }
        if ($("#select-source").val() !== "How did you hear about us?") {
          $(".nice-select .current").addClass("active");
        }
      });

      $("#news-sort").niceSelect();

      /*
            + Add background element to sections with box */

      $(".with-box").each(function () {
        var curr = $(this);
        if (curr.hasClass("alt-outro-anim"))
          $('<div class="box-bgr" />').prependTo(curr);
      });

      /*
            +  Remove unnecessary classes */

      $(".ordered-list").each(function () {
        var curr = $(this);
        if (!curr.find("p").length) curr.find("li").removeClass("active");
      });

      /*
            + Section with sub elements | pagination */

      $(".with-sub-elements")
        .not(".with-imgs-list")
        .each(function () {
          var curr = $(this),
            li = curr.find(".ordered-list li"),
            total = li.length < 10 ? "0" + li.length : li.length;
          if (curr.find("ol li p").length) {
            $(
              '<div class="pagination"><strong /><em>/' + total + "</em></div>"
            ).appendTo(curr);
            for (var i = 1; i <= li.length; i++) {
              var numb = i < 10 ? "0" + i : i;
              i == 1
                ? $('<span class="active">' + numb + "</span>").appendTo(
                    curr.find(".pagination strong")
                  )
                : $("<span>" + numb + "</span>").appendTo(
                    curr.find(".pagination strong")
                  );
            }
          }
        });

      /*
            + Call resize functionality */

      this.resize();

      /*
            + Scrollable section functionality */

      if (cf.device != "mobile") {
        $("section").each(function (i) {
          var curr = $(this);
          if (
            curr.hasClass("scrollable") ||
            curr.hasClass("with-auto-height")
          ) {
            $(".side-nav li")
              .eq(i)
              .find("ellipse")
              .css(cf.transitionSetter("none", "", "", ""));
          }
        });

        var raf;

        if (typeof raf == "undefined") scrollingAnimation();

        function scrollingAnimation() {
          if ($(".with-auto-height").length) {
            var withAutoH = $(".with-auto-height");
          } else if ($(".scrollable").length) {
            var withAutoH = $(".scrollable");
          }
          if (
            ($(".with-auto-height").length || $(".scrollable").length) &&
            !cf.body.hasClass("blog")
          ) {
            cf.distanceFromTop = withAutoH.scrollTop();
            if (Math.abs(cf.lastDistanceFromTop - cf.distanceFromTop) >= 1) {
              dY = cf.distanceFromTop - cf.lastDistanceFromTop;
              cf.lastDistanceFromTop += dY / 10;
              $(".side-nav li")
                .eq(withAutoH.index())
                .find("a svg ellipse")
                .css({
                  strokeDashoffset:
                    360 -
                    63 *
                      (cf.lastDistanceFromTop /
                        (withAutoH.find(".holder").outerHeight() - cf.windowH)),
                });
              $(".parallax").each(function (i) {
                var curr = $(this);
                if (
                  cf.common.parallaxOffsets[i].top - cf.distanceFromTop <
                    cf.windowH &&
                  cf.distanceFromTop -
                    (cf.common.parallaxOffsets[i].top +
                      cf.common.parallaxOffsets[i].height) <=
                    0
                ) {
                  cf.common.parallaxPosition(curr, i);
                }
              });
              $(".animated").each(function (i) {
                var curr = $(this),
                  currOffset = cf.windowH;
                if (
                  cf.common.animatedOffsets[i].top - cf.distanceFromTop <
                  currOffset
                )
                  curr.addClass("in-view");
              });
            }
          }
          if (cf.body.hasClass("blog")) {
            cf.distanceFromTop = $(window).scrollTop();
            if (Math.abs(cf.lastDistanceFromTop - cf.distanceFromTop) >= 1) {
              if (
                $(".beneath-blog").offset().top - cf.distanceFromTop <
                cf.windowH / 2
              ) {
                if (!cf.invertedBlog) {
                  $(".blog-section .arrow-down").addClass("faded");
                  $(".beneath-blog").removeClass("inverted");
                  $(".blog-outer").addClass("inverted");
                  $("#interactive-bgr .overlay").removeClass("light");
                  multipleSplats(parseInt(Math.random() * 1) + 2);
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    r: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    g: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    b: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config, 0.5, {
                    BLOOM_INTENSITY: 0.2,
                    ease: Linear.easeNone,
                  });
                  cf.invertedBlog = true;
                }
              } else {
                if (cf.invertedBlog) {
                  $(".blog-section .arrow-down").removeClass("faded");
                  $(".blog-outer").removeClass("inverted");
                  $(".beneath-blog").addClass("inverted");
                  $("#interactive-bgr .overlay").addClass("light");
                  multipleSplats(parseInt(Math.random() * 1) + 2);
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    r: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    g: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    b: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config, 0.5, {
                    BLOOM_INTENSITY: 0.0,
                    ease: Linear.easeNone,
                  });
                  cf.invertedBlog = false;
                }
              }
            }
          }
          raf = requestAnimationFrame(scrollingAnimation);
        }
      } else {
        var raf;

        if (typeof raf == "undefined") scrollingAnimation();

        function scrollingAnimation() {
          if (cf.body.hasClass("blog")) {
            cf.distanceFromTop = $(window).scrollTop();
            if (Math.abs(cf.lastDistanceFromTop - cf.distanceFromTop) >= 1) {
              if (
                $(".beneath-blog").offset().top - cf.distanceFromTop <
                cf.windowH / 2
              ) {
                if (!cf.invertedBlog) {
                  $(".beneath-blog").removeClass("inverted");
                  $(".blog-outer").addClass("inverted");
                  $("#interactive-bgr .overlay").removeClass("light");
                  multipleSplats(parseInt(Math.random() * 1) + 2);
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    r: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    g: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    b: 1,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config, 0.5, {
                    BLOOM_INTENSITY: 0.2,
                    ease: Linear.easeNone,
                  });
                  cf.invertedBlog = true;
                }
              } else {
                if (cf.invertedBlog) {
                  $(".blog-outer").removeClass("inverted");
                  $(".beneath-blog").addClass("inverted");
                  $("#interactive-bgr .overlay").addClass("light");
                  multipleSplats(parseInt(Math.random() * 1) + 2);
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    r: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    g: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config.BACK_COLOR, 0.5, {
                    b: 246,
                    ease: Linear.easeNone,
                  });
                  TweenLite.to(config, 0.5, {
                    BLOOM_INTENSITY: 0.0,
                    ease: Linear.easeNone,
                  });
                  cf.invertedBlog = false;
                }
              }

              if (
                $("#reach-out").offset().top - cf.distanceFromTop <
                cf.windowH
              ) {
                $(".blog-section .arrow-down").addClass("faded");
              } else {
                $(".blog-section .arrow-down").removeClass("faded");
              }
            }
          }
          raf = requestAnimationFrame(scrollingAnimation);
        }
      }
    },
    resize: function () {
      if ($(".members-list").length) {
        this.membersSlider.chunkPeopleSlider();
      }
      this.animatedOffsets = [];
      this.parallaxOffsets = [];

      $(".parallax, .animated").each(function (i) {
        var isHidden = false,
          curr = $(this);
        if (curr.parents("section").is(":hidden")) {
          curr.parents("section").show();
          isHidden = true;
        }
        var currParam = {
          top: curr.offset().top,
          height: curr.outerHeight(),
        };
        curr.hasClass("parallax")
          ? cf.common.parallaxOffsets.push(currParam)
          : cf.common.animatedOffsets.push(currParam);
        if (curr.hasClass("animated")) {
          if (curr.offset().top - cf.distanceFromTop < cf.windowH)
            curr.addClass("in-view");
        }
        if (isHidden) curr.parents("section").hide();
      });

      /*
            + Call slider resize functionality */

      var sliderResizeTimeout = null;

      sliderResizeTimeout = setTimeout(function () {
        if ($(".slider").length) {
          $(".members-list").length
            ? cf.common.membersSlider.resize()
            : cf.common.slider.resize();
        }
        clearTimeout(sliderResizeTimeout);
        sliderResizeTimeout = null;
      }, 1000);

      /*
            + Footer social nav position */

      if (cf.device != "mobile") {
        var footer = $(".footer"),
          isHidden = false;
        footerNav = footer.find(".footer-nav");
        if (footer.is(":hidden")) {
          footer.show();
          isHidden = true;
        }
        footerNav.removeAttr("style").children().removeAttr("style");
        if (cf.clonedFooter) {
          var firstClone = footerNav.children().eq(2).clone(true, true),
            secondClone = footerNav.children().eq(3).clone(true, true);
          $(firstClone).insertAfter(footerNav.children(":first-child"));
          $(secondClone).insertBefore(footerNav.children(":last-child"));
          footerNav.children().eq(3).remove();
          footerNav.children().eq(3).remove();
          cf.clonedFooter = false;
        }
        if (viewport().width > 1024) {
          // var navW = footer.find('.secondary-nav').width(),
          //     offset = footer.find('.footer-nav > li:last-child').width();
          // footer.find('.secondary-nav').css(cf.transformSetter(- (offset - navW) + 'px', '0px', 1, 1))
        } else {
          // footer.find('.secondary-nav').removeAttr('style');
          footerNav
            .css({
              display: "block",
              overflow: "hidden",
            })
            .children()
            .css({
              float: "left",
            });
          if (viewport().width > 768) {
            var currW = 0;
            for (var i = 0; i < 5; i++) {
              currW += footerNav.children().eq(i).outerWidth();
            }
            footerNav.children().css({
              marginRight: Math.floor((footerNav.width() - currW) / 4),
            });
            footerNav.children(":nth-child(5n)").css("margin-right", "");
            // var offset = footerNav.width() - footerNav.children().eq(0).outerWidth(true) - footerNav.children().eq(1).outerWidth(true) - footer.find('.secondary-nav').width();
            // footer.find('.secondary-nav').css(cf.transformSetter(-offset + 'px', '0px', 1, 1))
          } else {
            if (!cf.clonedFooter) {
              var firstClone = footerNav.children().eq(2).clone(true, true),
                secondClone = footerNav.children().eq(3).clone(true, true);
              $(firstClone).insertAfter(footerNav.children(":first-child"));
              $(secondClone).insertBefore(footerNav.children(":last-child"));
              footerNav.children().eq(3).remove();
              footerNav.children().eq(3).remove();
              cf.clonedFooter = true;
            }
            footerNav.children().eq(0).css("margin-bottom", "10px");
            footerNav
              .children(":nth-child(2), :nth-child(5)")
              .css("clear", "left");
            footerNav
              .children(":nth-child(3), :nth-child(4)")
              .css(cf.transformSetter("0px", "-29px", 1, 1));
            var currW = 0;
            for (var i = 1; i < 4; i++) {
              currW += footerNav.children().eq(i).width();
            }
            footerNav
              .children(":nth-child(1), :nth-child(2), :nth-child(3)")
              .css({
                marginRight: Math.floor((footerNav.width() - currW) / 2) - 2,
              });
            var lastRowMargin =
              footerNav.children(":nth-child(2)").outerWidth(true) -
              footerNav.children(":nth-child(5)").width();
            footerNav
              .children(":nth-child(5)")
              .css("margin-right", Math.floor(lastRowMargin));
            // var offset = footerNav.width() - footerNav.children().eq(4).outerWidth(true) - footer.find('.secondary-nav').width();
            // footer.find('.secondary-nav').css(cf.transformSetter(-offset + 'px', '0px', 1, 1))
          }
        }
        if (isHidden) footer.hide();
      }

      if (cf.device != "mobile") {
        /*
                + Adjust sections' height */

        $("section .holder").each(function () {
          var curr = $(this);
          if (!curr.parents(".bottom").length) curr.css("height", cf.windowH);
        });

        /*
                + Call snap functionality */

        cf.snap.resize();
      }

      /*
            + Split text into columns */

      if (cf.device != "mobile") {
        $(".with-columns .text-holder").uncolumnize();
        $(".with-columns").removeClass("with-columns");
        $(".simple, .with-box").each(function () {
          var curr = $(this),
            isHidden = false,
            prepTimeout = null;
          if (curr.is(":hidden")) {
            curr.show();
            isHidden = true;
          }
          if (curr.is(".with-box")) {
            curr.css(cf.transitionSetter("none", "", "", ""));
            curr.find(".holder").css(cf.transitionSetter("none", "", "", ""));
            curr.find(".box").css(cf.transitionSetter("none", "", "", ""));
          }
          curr
            .find(".text-wrapper")
            .css(cf.transitionSetter("none", "", "", ""));
          if (
            (curr.is(".with-box") &&
              !curr.hasClass("with-list") &&
              curr.find("article").outerHeight() >
                curr.find(".box").height() - 115) ||
            (curr.is(".simple") &&
              curr.find("article").outerHeight() > cf.windowH * 0.75 &&
              viewport().width > 768)
          ) {
            curr.addClass("with-columns");
            curr.find(".text-holder").columnize();
          } else {
            curr.removeClass("with-columns");
          }
          if (isHidden) curr.hide();
          prepTimeout = setTimeout(function () {
            if (curr.is(".with-box")) {
              curr.css(cf.transitionSetter("", "", "", ""));
              curr.find(".holder").css(cf.transitionSetter("", "", "", ""));
              curr.find(".box").css(cf.transitionSetter("", "", "", ""));
            }
            curr.find(".text-wrapper").css(cf.transitionSetter("", "", "", ""));
            clearTimeout(prepTimeout);
            prepTimeout = null;
          }, 50);
        });
      }

      /*
            + Position of slider nav for images list */

      if (viewport().width > 768) {
        $(".with-imgs-list").each(function () {
          var curr = $(this),
            holder = curr.find(".holder");
          (sliderNav = curr.find(".slider-nav")),
            (article = curr.find("article")),
            (isHidden = false);
          if (curr.is(":hidden")) {
            curr.show();
            isHidden = true;
          }
          sliderNav.css({
            left:
              viewport().width > 768
                ? holder.width() -
                  article.offset().left -
                  sliderNav.width() -
                  100
                : "",
          });
          if (isHidden) curr.hide();
        });
      } else {
        $(".with-imgs-list .slider-nav").removeAttr("style");
      }

      /*
            + Set navigation width */

      $(".main-nav").width(cf.windowW);

      /*
            + Call map functionality */

      if ($("#map").length && cf.mapInitialized) cf.common.map.resize();

      /*
            + SVG | font size and line height */

      if (!cf.html.hasClass("ie11")) {
        $(".outlined text").each(function () {
          var curr = $(this);
          if (curr.parents(".cta-btn").length) {
            var curr = $(this),
              parent = curr.parents("svg"),
              fontSize = parent.css("font-size");
            curr
              .attr("font-size", Math.ceil(fontSize))
              .attr("y", Math.ceil(fontSize));
            parent
              .width(
                cf.common.svgWH(curr.context.textContent, Math.ceil(fontSize))
                  .w * 1.05
              )
              .height(
                cf.common.svgWH(curr.context.textContent, Math.ceil(fontSize))
                  .h * 1.25
              );
          } else {
            var parent = curr.parents("svg"),
              fontSize = parent.css("font-size"),
              isHidden = false;
            if (curr.parents(".main-nav-holder").is(":hidden")) {
              isHidden = true;
              curr.parents(".main-nav-holder").show();
            }
            if (!curr.parents("section").hasClass("active")) {
              isHidden = true;
              curr.parents("section").show();
            }
            var currW =
              cf.device != "mobile"
                ? curr.parents(".holder").width() - 50
                : curr.parents("span").length
                ? curr.parents("span").width()
                : curr.parents("a").width();
            curr.attr("font-size", Math.ceil(parseInt(fontSize)));
            var div = document.createElement("div");
            div.style.position = "absolute";
            div.style.visibility = "hidden";
            div.style.height = "auto";
            div.style.width = "auto";
            div.style.maxWidth = currW + "px";
            div.style.fontSize = Math.ceil(parseInt(fontSize)) + "px";
            div.style.fontFamily = "Proxima Nova Bold";
            div.style.lineHeight = Math.ceil(parseInt(fontSize)) * 1.15 + "px";
            div.innerHTML =
              cf.common.outlinedTexts[curr.index(".outlined text")];
            document.body.appendChild(div);
            cf.splitLines($(div), Math.ceil(parseInt(fontSize)) * 1.15);
            curr.html($(div).html());
            parent.width($(div).width() * 1.05);
            parent.height($(div).height() * 1.2);
            document.body.removeChild(div);
            if (isHidden) curr.parents("section, .main-nav-holder").hide();
          }
        });
      }
    },
  },
  desktop: {
    init: function () {
      /*
            + Call common functionality */

      cf.common.init();

      /*
            + Call snap functionality */

      cf.snap.init();

      /*
            + Members list functionality */

      cf.body.on("mouseenter", ".members-list li.highlighted a", function () {
        var curr = $(this),
          currOffset = -curr.find("p").height() - 12;
        curr
          .find("hgroup")
          .css(cf.transformSetter("0px", currOffset + "px", 1, 1));
      });

      cf.body.on("mouseleave", ".members-list li.highlighted a", function () {
        var curr = $(this);
        curr.find("hgroup").css(cf.transformSetter("", "", "", ""));
      });

      /*
            + Custom cursor */

      var cursor = $(".cursor");

      $(document)
        .mousemove(function (e) {
          cursor.show().css({
            left: e.clientX - 72,
            top: e.clientY - 72,
          });
        })
        .mouseleave(function () {
          cursor.hide();
        });

      $(window).scroll(function (e) {
        //console.log(e)
        cursor.show().css({
          left: e.clientX - 72,
          top: e.clientY - 72,
        });
      });

      cf.body.on("mouseenter", ".members-list a", function () {
        cursor.addClass("over-link");
      });

      cf.body.on("mouseleave", ".members-list a", function () {
        cursor.removeClass("over-link");
      });

      $(
        ".close-map-btn, .blog-text a, .blog .share-wrap a, .blog .share-wrap .copy-url-btn, .blog-section .see-all a, .blog-section .arrow-down, .blog-menu-links-wrap a, .blog article > a, .blog .article-bottom .cats, .member-popup-wrapper aside ul li a, .back-btn, .accordion a, .js-close-modal, .form-list-outer li.form-bottom p a, .contact-modal .contact-modal-info-bottom ul li a, .contact-modal .contact-modal-info ul li a, .filters a, .imgs-list li a, .with-sub-elements .ordered-list li a, .with-sub-elements .ordered-list li span, .side-nav, .nav-trigger, .info-box a, .btn, .cta-btn, .ordered-list a, button, .footer a, input, header .logo, .with-auto-height a, scrollable a, .desktop-main-nav a, .footer-awards-logos li a, .careers-awards-logos li a, .footer-main-menu li a, .footer-main-columns .contact-info a, .footer-social-menu li a, .bottom-footer-text a, .select-source-outer span, .select-source-outer li"
      )
        .mouseenter(function () {
          if (!$(this).parent().hasClass("disabled"))
            cursor.addClass("over-link");
        })
        .mouseleave(function () {
          cursor.removeClass("over-link");
        });

      /*
            + IE11 */

      if (cf.html.hasClass("ie11")) {
        $(".ordered-list svg").each(function () {
          var curr = $(this),
            currText = curr.text();
          curr.parent().text(currText).children("svg").remove();
        });
      }

      /*
            + Contact popup functionality  */

      cf.body.on("click", ".popup-trigger", function (e) {
        e.preventDefault();
        $(".contact-modal-wrap").addClass("opened");
        cf.popupOpened = true;
      });

      $(document).keyup(function (e) {
        if (e.key === "Escape" && $(".contact-modal-wrap").hasClass("opened")) {
          $(".js-close-modal").trigger("click");
        }
      });

      cf.body.on("click", ".js-close-modal", function (e) {
        e.preventDefault();
        $(".contact-modal-wrap").removeClass("opened");
        cf.popupOpened = false;
      });

      /*
            + Sticky btn */

      /*
            + Call resize functionality */

      this.resize();
    },
    resize: function () {},
  },
  handheld: {
    init: function () {
      /*
            + Call common functionality */

      cf.common.init();

      /*
            + Call snap functionality */

      if (cf.device == "tablet") {
        cf.snap.init();
      } else {
        $(".menu-cta").click(function (e) {
          e.preventDefault();
          $(".nav-trigger").trigger("click");
          if ($(".beneath-blog").length) {
            $("html, body")
              .stop()
              .animate(
                {
                  scrollTop: $("#reach-out").offset().top,
                },
                2000,
                "easeInOutCubic"
              );
          } else {
            $("html, body")
              .stop()
              .animate(
                {
                  scrollTop:
                    cf.distanceFromTop < $("section:last-child").offset().top
                      ? $("section:last-child").offset().top + 65
                      : $("section:last-child").offset().top - 24,
                },
                2000,
                "easeInOutCubic"
              );
          }
        });
        var clonedSocialNav = $(".main-nav-holder .info-box ul").clone(
          true,
          true
        );
        $(clonedSocialNav).appendTo(".main-nav-holder .info-box p");
        $(".main-nav-holder .info-box > ul").remove();
      }

      /*
            + Call resize functionality */

      this.resize();

      /*
            + Scrolling animation and side navigation funtionality | Accordion */

      if (cf.device == "mobile") {
        var raf,
          runningTimeout = null;

        if (typeof raf == "undefined") scrollingAnimation();

        function scrollingAnimation() {
          cf.distanceFromTop = $(window).scrollTop();

          if (cf.distanceFromTop != cf.lastDistanceFromTop) {
            if (!cf.mapViewed) {
              cf.distanceFromTop > cf.lastDistanceFromTop &&
              cf.distanceFromTop > 0 &&
              !cf.popupOpened
                ? cf.body.addClass("header-up")
                : cf.body.removeClass("header-up");

              cf.distanceFromTop <= 0 && !cf.popupOpened
                ? cf.body.removeClass("sticky-header").removeClass("header-up")
                : cf.body.addClass("sticky-header");

              if (cf.device == "mobile" && cf.body.hasClass("blog")) {
                if (cf.distanceFromTop > 0) {
                  $(".blog-outer > .holder > .container").css({
                    paddingTop: $(".blog-menu").height(),
                  });
                } else {
                  $(".blog-outer > .holder > .container").removeAttr("style");
                }
              }
            } else {
              cf.body.addClass("sticky-header").removeClass("header-up");
            }

            cf.lastDistanceFromTop = cf.distanceFromTop;
          }

          raf = requestAnimationFrame(scrollingAnimation);
        }
      }

      $(".popup-holder").scroll(function (e) {
        var curr = $(this);
        if (curr.scrollTop() >= 0) {
          cf.currPopupOffset < curr.scrollTop()
            ? cf.body.addClass("header-up")
            : cf.body.removeClass("header-up");
          cf.currPopupOffset = curr.scrollTop();
        }
      });
    },
    resize: function () {
      /*
            + Call snap resize functionality */

      if (cf.device == "tablet") cf.snap.resize();
    },
  },
  resize: function () {
    if (this.device == "desktop" || this.windowW != viewport().width) {
      if (this.resizeTimeout != null) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = null;
      }

      this.resizeTimeout = setTimeout(function () {
        cf.windowW = viewport().width;
        cf.windowH = $(window).height();

        cf.common.resize();

        cf.device == "desktop" ? cf.desktop.resize() : cf.handheld.resize();

        clearTimeout(cf.resizeTimeout);
        cf.resizeTimeout = null;
      }, 1000);
    }
  },
};

$(window).resize(function () {
  cf.resize();
});

cf.init();

cf.resize();

if (
  cf.device == "mobile" ||
  (cf.device == "tablet" && cf.body.hasClass("profile"))
) {
} else {
  $(".popup").scroll(function () {
    var curr = $(this),
      scrollTop = curr.children().offset().top;
    if (curr.parents(".member-popup-wrapper").length)
      curr
        .find("aside")
        .css(cf.transformSetter("0px", -scrollTop + "px", 1, 1));
  });
}

// BLOG RELATED JS CODE
// Desktop menu js
$(document).on("click", ".blog-menu-links-wrap a", function (event) {
  event.stopPropagation();
  var $dropdown_a = $(".blog-menu-links-wrap a");

  $dropdown_a.removeClass("active");
  $(this).addClass("active");
});

// Drop menu js
$(document).on("click", ".btn-drop", function (event) {
  event.stopPropagation();
  var $btn_drop = $(this);
  var $dropdown = $btn_drop.next(".blog-menu-links-wrap");
  var $dropdown_a = $(".blog-menu-links-wrap a");

  $dropdown.removeClass("hidden");

  $btn_drop.toggleClass("active");
  $dropdown.toggleClass("active");

  $dropdown_a.on("click", function () {
    $dropdown_a.removeClass("current-drop");
    $(this).addClass("current-drop");

    $btn_drop.text($(this).text());
  });
});

/* Show Search Input - remove for now, as we have autosuggest search plugin in place
  $(document).on("click", ".btn-search, .btn-search-back", function(event){
    event.stopPropagation();
    var $search = $(".blog-menu-search");
    var $search_sg = $(".blog-menu-search-suggestion");

    $search.toggleClass("show");
    $search_sg.toggleClass("show");
    $("html").toggleClass("overflow-non");
  });*/

// Copy URL
if ($(".copy-url-btn").length) {
  var clipboard = new ClipboardJS(".copy-url-btn");
  clipboard.on("success", function (e) {
    alert("URL copied!");
    e.clearSelection();
  });
}

// Copy URL
if ($("#news-sort").length) {
  $("#news-sort").on("change", function () {
    window.location.href = $(this).val();
  });
}

var testDistanceFromTop = $(window).scrollTop(),
  testLastDistanceFromTop = 0;

if (!cf.html.hasClass("mobile") && cf.body.hasClass("blog")) {
  var raf1;

  if (typeof raf1 == "undefined") scrollingAnimation1();

  function scrollingAnimation1() {
    cf.testDistanceFromTop = $(window).scrollTop();

    if (cf.testDistanceFromTop != cf.testLastDistanceFromTop) {
      cf.testDistanceFromTop > cf.testLastDistanceFromTop &&
      cf.testDistanceFromTop > 0
        ? cf.body.addClass("header-up")
        : cf.body.removeClass("header-up");

      cf.testLastDistanceFromTop = cf.testDistanceFromTop;
    }

    raf1 = requestAnimationFrame(scrollingAnimation1);
  }
}
