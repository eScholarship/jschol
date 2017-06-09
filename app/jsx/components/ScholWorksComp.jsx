// ##### Scholarly Works Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class DotDiv extends React.Component {
  componentDidMount() {
    $(this.domEl).dotdotdot({watch:"window"})
  }

  render = () =>
    <div className={this.props.className} ref={el => this.domEl = el}>
      {this.props.children}
    </div>
}

class DotH2 extends React.Component {
  xcomponentDidMount() {
    $(this.domEl).dotdotdot({watch:"window"})
  }

  render = () =>
    <h2 className={this.props.className} ref={el => this.domEl = el}>
      {this.props.children}
    </h2>
}

class ScholWorksComp extends React.Component {
  render() {
    var tagList = [];
    if (this.props.result.genre === 'article') {
      tagList.push({display: 'Article', tagStyle: 'article'});
    }
    if (this.props.result.genre === 'monograph') {
      tagList.push({display: 'Book', tagStyle: 'book'});
    }
    if (this.props.result.genre === 'dissertation') {
      tagList.push({display: 'Thesis', tagStyle: 'thesis'});
    }
    if (this.props.result.genre === 'multimedia') {
      tagList.push({display: 'Multimedia', tagStyle: 'multimedia'});
    }
    if (this.props.result.peerReviewed === true) {
      tagList.push({display: 'Peer Reviewed', tagStyle: 'peer'});
    }
    
    var publishingInfo;
    var unitId;
    if ('journalInfo' in this.props.result) {
      publishingInfo = this.props.result.journalInfo.displayName;
      unitId = this.props.result.journalInfo.unitId;
    } else if ('unitInfo' in this.props.result) {
      publishingInfo = this.props.result.unitInfo.displayName;
      unitId = this.props.result.unitInfo.unitId;
    }

    var authorList;
    if (this.props.result.authors) {
      authorList = this.props.result.authors.map(function(author, i, a) {
        if (i === a.length-1) {
          return (<li key={author+i}><Link to={"/search/?q="+author.name}>{author.name}</Link></li>);
        } else {
          return (<li key={author+i}><Link to={"/search/?q="+author.name}>{author.name}</Link>; </li>);
        }
      });
    }

    var supp_files = this.props.result.supp_files.map(function(supp_file, i, a) {
      if (supp_file.count >= 1) {
        var display;
        if (supp_file.type === 'video' || supp_file.type === 'image') {
          display = supp_file.count != 1 ? supp_file.type + 's' : supp_file.type;
        } else if (true || supp_file.type === 'audio') {
          display = supp_file.count != 1 ? 'audio files' : 'audio file';
        } else if (supp_file.type === 'pdf') {
          display = supp_file.count != 1 ? 'additional PDFs' : 'additional PDF';
        }
        return (<li key={supp_file+i} className={"c-scholworks__media-" + supp_file.type}>Contains {supp_file.count} {display}</li>);   
      }
    });
    // if ('supp_files' in this.props.result && this.props.result.supp_files !== null) {
    //   if ('video' in this.props.result.supp_files && this.props.result.supp_files.video !== 0) {
    //     supp_files.append(<li className="c-scholworks__media-video">Contains {this.props.result.supp_files.video} videos</li>);
    //   }
    //   if ('image' in this.props.result.supp_files && this.props.result.supp_files.image !== 0) {
    //     supp_files.append(<li className="c-scholworks__media-image">Contains {this.props.result.supp_files.image} images</li>);
    //   }
    //   if ('pdf' in this.props.result.supp_files && this.props.result.supp_files.pdf !== 0) {
    //     supp_files.append(<li className="c-scholworks__media-pdf">Contains {this.props.result.supp_files.pdf} additional PDFs</li>);
    //   }
    //   if ('audio' in this.props.result.supp_files && this.props.result.supp_files.audio !== 0) {
    //     supp_files.append(<li className="c-scholworks__media-audio">Contains {this.props.result.supp_files.audio} audio files</li>);
    //   }
    // }
    
    return (
      <section className="c-scholworks">
        <div className="c-scholworks__main-column">
          <ul className="c-scholworks__tag-list">
            { tagList.map(function(tag, i, a) { 
              return (
                <li key={tag+i} className={ "c-scholworks__tag-" + tag.tagStyle }>{tag.display}</li>
              ) 
            }) }
          </ul>
          <heading>
            <DotH2 className="c-scholworks__heading">
              <Link to={"/uc/item/"+this.props.result.id.replace(/^qt/, "")}>{this.props.result.title}</Link>
            </DotH2>
          </heading>
          {authorList && 
            <DotDiv className="c-authorlist">
              <ul className="c-authorlist__list">
                {authorList}
              </ul>
            </DotDiv>
          }
          {this.props.result.pub_year && publishingInfo && 
            <div className="c-scholworks__publication">
              <Link to={"/uc/" + unitId}>{publishingInfo}</Link> ({this.props.result.pub_year})
            </div>
          }
          {this.props.result.abstract && 
            <DotDiv className="c-scholworks__abstract">
              <p>{this.props.result.abstract}</p>
            </DotDiv>
          }
          <div className="c-scholworks__media">
            <ul className="c-scholworks__media-list">{ supp_files }</ul>
            {this.props.result.rights && this.props.result.rights !== 'public' && <img className="c-scholworks__rights" src="/images/cc-by-small.svg" alt="creative commons attribution 4.0 international public license"/>}
          </div>
        </div>
        {this.props.result.thumbnail && <img className="c-scholworks__article-preview" src="/images/temp_article.png" alt="article"/>}
      </section>
    )
  }
}

module.exports = ScholWorksComp;
