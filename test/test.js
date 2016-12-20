import React from 'react'
import { expect } from 'chai'
import { shallow, mount, render } from 'enzyme'
import { FacetItem } from '../app/jsx/pages/SearchPage.jsx'

// FacetItem  
// props = {
//   data: { facetType: 'departments',
//     ancestorChecked: true|false                     //Optional, only specified if facet has ancestors (departments)
//     facet: { value: 'uclalaw',
//       displayName: 'UCLA School of Law',            //Optional, if no displayName specified, uses facet.value for display
//       count: 331,
//       descendents: [                                //Optional, only specified if facet has children (departments)
//         {
//           ancestor_in_list: true,
//           count: 9,
//           displayName: 'The Williams Institute',
//           value: 'uclalaw_williams'
//         }
//       ]
//       ancestor_in_list: true|false,                 // Optional, only specified if facet has ancestors (departments),
//                                                     // and the ancestor is also in the facet list
//                                                     // Though it doesn't currently make sense for ancestor_in_list to be false,
//                                                     // the frontend doesn't assume that to be the case.
//     }
//   }
//   //Handler is FacetFieldset's handleChange function
//   handler: FacetFieldset.handleChange(event, filter=[], filter_cleanup=[])
//   //Query is an array of applied filters for the current fieldset (departments, in this case) ONLY
//   //child filters are not listed, since these are assumed under the parent 'uclalaw' and not included in the AWS query
//   //query is not defined if no filters are applied for the current fieldset
//   query: [{displayName: 'UCLA School of Law (All)', value: 'uclalaw'}]
// }
describe('<FacetItem />', () => {
  it ('contains div with className facetItem', () => {
    var props = { 
      facetType: 'departments', 
      facet: {
        value: 'uclalaw', 
        displayName: 'UCLA School of Law', 
        count: 331, 
        descendents: [
          {
            ancestor_in_list: true, 
            count: 9, 
            displayName: 'The Williams Institute', 
            value: 'uclalaw_williams'
          }
        ]
      }
    };
    expect(shallow(<FacetItem data={props}/>).hasClass("facetItem")).to.equal(true);
  });
});