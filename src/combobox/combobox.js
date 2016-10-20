"use strict";

module.exports = function($timeout, $document, $window) {

    var angular = require('angular');

    var KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        COMMAND: 91
    };

    function link($scope, $element, attrs, ngModel) {
        var textInput = $element[0].querySelectorAll(".search-input")[0];
        var dropdown = $element[0].querySelectorAll(".dropdown-list")[0];
        var startIndex, endIndex;

        $scope.onChange = function() {
            $scope.$ctrl.search = getSelectionText(textInput);
            $scope.refreshList($scope.$ctrl.search);
            var source;
            if ($scope.groupBy) {
                source = $scope.$ctrl.groups;
            } else {
                source = $scope.$ctrl.sourceList;
            }
            if (source && source.length > 0) {
                $scope.$ctrl.open = true;
            } else {
                $scope.$ctrl.open = false;
            }
        };

        function syncActive(type) {
            if ($scope.groupBy) {
                var i, group, index;
                for (i = 0; i < $scope.$ctrl.groups.length; i++) {
                    group = $scope.$ctrl.groups[i];
                    index = group.items.indexOf($scope.$ctrl.activeItem);
                    if (index !== -1) {
                        if (type === "DOWN") {
                            if (index < group.items.length - 1) {
                                $scope.$ctrl.activeItem = group.items[index + 1];
                                index ++;
                            } else {
                                if (i < $scope.$ctrl.groups.length - 1) {
                                    $scope.$ctrl.activeItem = $scope.$ctrl.groups[i + 1].items[0];
                                    index ++;
                                }
                            }
                        } else if (type === "UP") {
                            if (index > 0) {
                                $scope.$ctrl.activeItem = group.items[index - 1];
                                index --;
                            } else {
                                if (i > 0) {
                                    $scope.$ctrl.activeItem =
                                        $scope.$ctrl.groups[i - 1].items[$scope.$ctrl.groups[i - 1].items.length - 1];
                                    index --;
                                }
                            }
                        }
                        var activeIndex = 0;
                        if (i === 0) {
                            activeIndex = index;
                        } else {
                            for (i = i - 1; i >= 0; i--) {
                                activeIndex = activeIndex + $scope.$ctrl.groups[i].items.length;
                            }
                            activeIndex = activeIndex + index;
                        }
                        $scope.$ctrl.activeIndex = activeIndex;
                        _ensureHighlightVisible();
                        return;
                    }
                }
            } else {
                if ($scope.$ctrl.sourceList && $scope.$ctrl.sourceList.length > 0) {
                    if ($scope.$ctrl.activeItem) {
                        if ($scope.$ctrl.sourceList.indexOf($scope.$ctrl.activeItem) !== -1) {
                            $scope.$ctrl.activeIndex = $scope.$ctrl.sourceList.indexOf($scope.$ctrl.activeItem);
                            _ensureHighlightVisible();
                            return;
                        }
                    }
                    $scope.$ctrl.activeItem = $scope.$ctrl.sourceList[0];
                    $scope.$ctrl.activeIndex = 0;
                } else {
                    $scope.$ctrl.activeItem = null;
                    $scope.$ctrl.activeIndex = -1;
                }
            }
            _ensureHighlightVisible();
        }

        function _ensureHighlightVisible() {
            if (!$scope.$ctrl.activeItem) {
                return;
            }
            var container = dropdown || $element[0].querySelectorAll(".dropdown-list")[0];
            var choices = container.querySelectorAll('.select-choices-row-inner');

            var highlighted = choices[$scope.$ctrl.activeIndex];

            if (!highlighted || !container) {
                return;
            }

            var posY = highlighted.offsetTop + highlighted.clientHeight - container.scrollTop;
            var height = container.offsetHeight;

            if (posY > height) {
                container.scrollTop += posY - height;
            } else if (posY < highlighted.clientHeight) {
                if ($scope.groupBy && $scope.$ctrl.activeIndex === 0) {
                    //To make group header visible when going all the way up
                    container.scrollTop = 0;
                }
                else {
                    container.scrollTop -= highlighted.clientHeight - posY;
                }
            }
        }

        $scope.onFocus = function() {
            if ($scope.$ctrl.selecting) {
                $scope.$ctrl.selecting = false;
                return;
            }
            if (!$scope.$ctrl.open) {
                $scope.$ctrl.open = true;
                $scope.refreshList($scope.$ctrl.search);
                _ensureHighlightVisible();
            }
        };

        $scope.refreshList = function(search) {
            var exist = false;
            if ($scope.groupBy) {
                $scope.$ctrl.groups = [];
                $scope.$ctrl.orgGroups.forEach(function(group) {
                    var grouptem = {
                        name: group.name,
                        items: group.items.filter($scope.filterFunction)
                    };
                    if (grouptem.items && grouptem.items.length > 0) {
                        $scope.$ctrl.groups.push(grouptem);
                        if ($scope.$ctrl.activeItem && !exist) {
                            if (grouptem.items.indexOf($scope.$ctrl.activeItem) !== -1) {
                                exist = true;
                            }
                        }
                    }
                });
                if (exist) {
                    return;
                } else {
                    if ($scope.$ctrl.groups.length > 0) {
                        $scope.$ctrl.activeItem = $scope.$ctrl.groups[0].items[0];
                        $scope.$ctrl.activeIndex = 0;
                    } else {
                        $scope.$ctrl.activeItem = null;
                        $scope.$ctrl.activeIndex = -1;
                    }
                }
            } else {
                $scope.$ctrl.sourceList = $scope.sourceList.filter($scope.filterFunction);
                if ($scope.$ctrl.sourceList && $scope.$ctrl.sourceList.length > 0) {
                    if ($scope.$ctrl.activeItem) {
                        if ($scope.$ctrl.sourceList.indexOf($scope.$ctrl.activeItem) !== -1) {
                            $scope.$ctrl.activeIndex = $scope.$ctrl.sourceList.indexOf($scope.$ctrl.activeItem);
                            return;
                        }
                    }
                    $scope.$ctrl.activeItem = $scope.$ctrl.sourceList[0];
                    $scope.$ctrl.activeIndex = 0;
                } else {
                    $scope.$ctrl.activeItem = null;
                    $scope.$ctrl.activeIndex = -1;
                }
            }
            _ensureHighlightVisible();
        };

        function uisOffset(element) {
            var boundingClientRect = element.getBoundingClientRect();
            return {
                width: boundingClientRect.width || angular.element(element).prop('offsetWidth'),
                height: boundingClientRect.height || angular.element(element).prop('offsetHeight'),
                top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
            };
        }

        function onDocumentClick(e) {
            if (!$scope.$ctrl.open) {
                return;
            }
            var contains = $element[0].contains(e.target);
            if (!contains) {
                $scope.$ctrl.open = false;
                $scope.$digest();
            }
        }

        function positionDropdown() {
            if (!$scope.$ctrl.open) {
                return;
            }

            textInput = textInput || $element[0].querySelectorAll(".search-input")[0];
            dropdown = dropdown || $element[0].querySelectorAll(".dropdown-list")[0];
            var offset = uisOffset(textInput);
            var offsetDropdown = uisOffset(dropdown);
            var scrollTop = $document[0].documentElement.scrollTop || $document[0].body.scrollTop;
            dropdown.style.minWidth = offset.width + "px";
            dropdown.style.top = offset.top + offset.height - scrollTop + "px";
        }


        $document.on('click', onDocumentClick);
        window.addEventListener('scroll', positionDropdown, true);
        angular.element($window).on('resize', positionDropdown);

        $scope.$on('$destroy', function() {
            $document.off('click', onDocumentClick);
            window.removeEventListener('scroll', positionDropdown, true);
            angular.element($window).off('resize', positionDropdown);
        });

        angular.element(textInput).on('keydown', function(e) {
            var key = e.which;

            if (!$scope.$ctrl.open || $scope.$ctrl.noSource) {
                return;
            }

            if ([KEY.ENTER, KEY.ESC].indexOf(key) !== -1) {
                e.preventDefault();
                e.stopPropagation();
            }

            $scope.$apply(function() {
                switch (key) {
                    case KEY.DOWN:
                        syncActive("DOWN");
                        break;
                    case KEY.UP:
                        syncActive("UP");
                        break;
                    case KEY.ENTER:
                        $scope.onItemClick($scope.$ctrl.activeItem);
                        break;
                    case KEY.ESC:
                        $scope.$ctrl.open = false;
                        break;
                    default:
                        break;
                }
            });
        });

        $scope.$watch("$ctrl.open", function(newValue) {
            if (newValue) {
                positionDropdown();
            }
        });

        ngModel.$render = function() {
            $scope.$ctrl.inputText = ngModel.$viewValue;
        };

        $scope.$watch("$ctrl.inputText", function(newValue) {
            if (ngModel.$viewValue !== newValue) {
                ngModel.$setViewValue(newValue);
            }
        });

        $scope.onItemClick = function(item) {
            $scope.$ctrl.selecting = true;
            var str = "";
            if ($scope.valueField) {
                str = item[$scope.valueField];
            } else {
                str = item;
            }
            if (!$scope.$ctrl.inputText) {
                $scope.$ctrl.inputText = str;
            } else if (startIndex === 0) {
                $scope.$ctrl.inputText = str + $scope.$ctrl.inputText.substring(endIndex);
            } else {
                var startText = $scope.$ctrl.inputText.substring(0, startIndex);
                var endText = $scope.$ctrl.inputText.substring(endIndex);
                $scope.$ctrl.inputText = startText + str + endText;
            }

            $scope.$ctrl.open = false;

            $timeout(function() {
                textInput.focus();
            });
        };

        function getSelectionText(input) {
            var value, pos = 0;
            if (input) {
                value = input.value;
                if (!value || value.trim() === "") {
                    return "";
                }
                if ('selectionStart' in input) {
                    pos = input.selectionStart;
                } else if ('selection' in document) {
                    var sel = document.selection.createRange();
                    var selLength = Sel.text.length;
                    sel.moveStart('character', -value.length);
                    pos = sel.text.length - selLength;
                }

                var subStr;
                if (pos === 0) {
                    startIndex = 0;
                } else {
                    subStr = value.substring(0, pos);
                    startIndex = subStr.lastIndexOf(" ");
                    if (startIndex === -1) {
                        startIndex = 0;
                    } else {
                        startIndex = startIndex + 1;
                    }
                }

                endIndex = value.indexOf(" ", pos);
                if (endIndex === -1) {
                    endIndex = value.length;
                }

                if (endIndex <= startIndex) {
                    return "";
                }

                return value.substring(startIndex, endIndex);
            }
            return "";
        }
    }

    function controller($scope) {
        var $ctrl = this;
        $ctrl.search = "";
        $ctrl.open = false;
        $ctrl.activeItem;
        $ctrl.activeIndex = -1;
        $ctrl.collapseMap = {};
        $ctrl.orgGroups = [];
        $ctrl.selecting = false;

        $scope.filterFunction = function(item) {
            if ($scope.labelField) {
                return item[$scope.labelField].indexOf($scope.$ctrl.search) !== -1;
            } else {
                return item.indexOf($scope.$ctrl.search) !== -1;
            }
        };

        $ctrl.onCollapse = function(groupName) {
            $ctrl.collapseMap[groupName] = !$ctrl.collapseMap[groupName];
        };

        $ctrl.getLabel = function(item) {
            if ($scope.labelField) {
                return item[$scope.labelField];
            } else {
                return item;
            }
        };

        $ctrl.findGroupByName = function(name) {
            return $ctrl.orgGroups && $ctrl.orgGroups.filter(function(group) {
                return group.name === name;
            })[0];
        };

        $scope.$watch("sourceList", function(newValue) {
            if (!newValue || newValue.length === 0) {
                $ctrl.noSource = true;
            } else {
                $ctrl.noSource = false;
            }
            if ($scope.groupBy) {
                angular.forEach($scope.sourceList, function(item) {
                    var groupName = item[$scope.groupBy];
                    var group = $ctrl.findGroupByName(groupName);
                    if (group) {
                        group.items.push(item);
                    } else {
                        $ctrl.orgGroups.push({
                            name: groupName,
                            items: [item]
                        });
                    }
                });
                $ctrl.groups = $ctrl.orgGroups;
            } else {
                $ctrl.sourceList = $scope.sourceList.filter($scope.filterFunction);
            }
        });
    }

    return {
        restrict: 'AE',
        replace: true,
        require: "ngModel",
        template: require('./combobox.html'),
        controller: ["$scope", controller],
        controllerAs: "$ctrl",
        scope: {
            sourceList: "<",
            isDisabled: "<",
            groupBy: "<",
            labelField: "<",
            valueField: "<",
            itemIconClass: "<",
            groupIconClass: "<"
        },
        link: link
    };
};
