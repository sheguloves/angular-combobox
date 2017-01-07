# angular-combobox

### Javascript

```
var app = require('angular').module('common',[]);

app.directive('combobox', ['$timeout', '$document', '$window', '$parse', require('./combobox/combobox')]);
```

### HTML

```
<combobox is-disabled="disabled" source-list="tableList" ng-model="model.text" ng-change="onchange()" group-by="'table'" label-field="'name'" value-field="'value'"></combobox>
```
