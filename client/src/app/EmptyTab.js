/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import PlatformIcon from '../../resources/icons/Platform.svg';

import * as css from './EmptyTab.less';

import {
  Tab
} from './primitives';


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() { }

  renderDiagramButton = (key, entry) => {
    const {
      onAction
    } = this.props;

    return (
      <button key={ key } className="btn btn-secondary" onClick={ () => onAction(entry.action, entry.options) }>
        {entry.icon && <entry.icon />}
        {entry.label}
      </button>
    );
  };

  /**
   * @param {string} group
   *
   * @return {React.JSX.Element[]}
   */
  getCreateButtons(group) {
    const providers = this.props.tabsProvider?.getProviders() || {};

    const tabs = Object.values(providers)
      .flatMap(tab => tab.getNewFileMenu && tab.getNewFileMenu().map(entry => ({ ...entry, icon: tab.getIcon() })))
      .filter(entry => entry?.group === group)
      .map((entry, index) => {
        return this.renderDiagramButton(index, entry);
      });

    return tabs;
  }

  renderPlatformColumn = () => {

    const createButtons = this.getCreateButtons('Fluxnova');

    return (
      <div id="welcome-page-platform" className="welcome-card" data-testid="welcome-page-platform">
        <div className="engine-info">
          <div className="engine-info-heading">
            <PlatformIcon className="engine-icon platform-icon" />
            <h3>Fluxnova</h3>
          </div>
        </div>

        <p>Create a new file</p>

        {createButtons}
      </div>
    );
  };

  renderLearnMoreColumn = () => {

    return (
      <div id="welcome-page-learn-more" className="welcome-card">
        <div className="learn-more">
          <h3>Learn more</h3>
          <div className="article relative">
            <p>Introduction to Fluxnova</p>
            <a href="https://docs.fluxnova.finos.org/get-started/quick-start">Getting Started</a>
          </div>
          <div className="article">
            <p>About Modeler 1</p>
            <a href="#" onClick={ () => this.props.onAction('emit-event', { type: 'versionInfo.open' }) }>Open &quot;What&apos;s new&quot;</a>
          </div>
          <div className="article">
            <p>Model your first diagram</p>
            <a href="https://docs.fluxnova.finos.org/">Fluxnova Docs</a>
          </div>
        </div>
      </div>
    );
  };

  render() {

    return (
      <Tab className={ css.EmptyTab }>
        {<h2 className="welcome-header">Get Started:</h2>}
        <div className="welcome-cards">
          {this.renderPlatformColumn()}
          {this.renderLearnMoreColumn()}
        </div>
      </Tab>
    );
  }
}

