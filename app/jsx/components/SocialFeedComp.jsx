// ##### Social Feed Component ##### //

import React from 'react'
// https://github.com/andrewsuzuki/react-twitter-widgets
import { Timeline } from 'react-twitter-widgets'

{/* ToDo: See if this 'Error: sandbox not initialized' goes away when we upgrade react
    https://github.com/andrewsuzuki/react-twitter-widgets/issues/10 */} 
class SocialFeedComp extends React.Component {
  render() {
    return (
      <div className="c-socialfeed">
        <Timeline
          dataSource={{
            sourceType: 'profile',
            screenName: this.props.handle
          }}
          options={{
            username: this.props.handle,
            height: '700'
          }}
        />
      </div>
    )
  }
}

module.exports = SocialFeedComp;