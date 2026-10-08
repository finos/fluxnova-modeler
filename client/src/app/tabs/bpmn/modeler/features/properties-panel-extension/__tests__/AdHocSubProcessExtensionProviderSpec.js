import { expect } from 'chai';
import sinon from 'sinon';
import AdHocSubProcessExtensionProvider from '../AdHocSubProcessExtensionProvider';

describe('AdHocSubProcessExtensionProvider', function() {
  let propertiesPanel;

  beforeEach(function() {
    propertiesPanel = { registerProvider: sinon.spy() };
  });

  it('should register provider with propertiesPanel', function() {
    const provider = new AdHocSubProcessExtensionProvider(propertiesPanel);

    expect(provider).to.exist;
    expect(propertiesPanel.registerProvider.calledOnce).to.be.true;
    expect(propertiesPanel.registerProvider.firstCall.args[0]).to.equal(100);
  });

  describe('#getGroups', function() {
    let provider, createAdHocSubProcessGroupsStub;

    beforeEach(function() {
      createAdHocSubProcessGroupsStub = sinon.stub();
      provider = new AdHocSubProcessExtensionProvider(propertiesPanel, createAdHocSubProcessGroupsStub);
    });

    it('should not add groups if already present', function() {
      const groups = [
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] },
        { id: 'other', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      expect(result.filter(g => g.id === 'ad_hoc_subprocess_active_tasks').length).to.equal(1);
      expect(result.filter(g => g.id === 'ad_hoc_subprocess_completion').length).to.equal(1);
      expect(createAdHocSubProcessGroupsStub.called).to.be.false;
    });

    it('should add both groups if neither present and groups are created', function() {
      createAdHocSubProcessGroupsStub.returns([
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] }
      ]);
      const groups = [
        { id: 'other', entries: [] },
        { id: 'another', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      expect(result.find(g => g.id === 'ad_hoc_subprocess_active_tasks')).to.exist;
      expect(result.find(g => g.id === 'ad_hoc_subprocess_completion')).to.exist;
    });

    it('should not add groups if createAdHocSubProcessGroups returns empty array', function() {
      createAdHocSubProcessGroupsStub.returns([]);
      const groups = [
        { id: 'other', entries: [] },
        { id: 'another', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      expect(result.find(g => g.id === 'ad_hoc_subprocess_active_tasks')).to.not.exist;
      expect(result.find(g => g.id === 'ad_hoc_subprocess_completion')).to.not.exist;
    });

    it('should insert both groups after subprocess adjacent group', function() {
      createAdHocSubProcessGroupsStub.returns([
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] }
      ]);
      const groups = [
        { id: 'foo', entries: [] },
        { id: 'subprocess', entries: [] },
        { id: 'bar', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      const activeTasksIndex = result.findIndex(g => g.id === 'ad_hoc_subprocess_active_tasks');
      const subprocessIndex = result.findIndex(g => g.id === 'subprocess');
      expect(activeTasksIndex).to.equal(subprocessIndex + 1);
    });

    it('should insert both groups after CamundaPlatform__Subprocess group', function() {
      createAdHocSubProcessGroupsStub.returns([
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] }
      ]);
      const groups = [
        { id: 'foo', entries: [] },
        { id: 'CamundaPlatform__Subprocess', entries: [] },
        { id: 'bar', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      const activeTasksIndex = result.findIndex(g => g.id === 'ad_hoc_subprocess_active_tasks');
      const camundaIndex = result.findIndex(g => g.id === 'CamundaPlatform__Subprocess');
      expect(activeTasksIndex).to.equal(camundaIndex + 1);
    });

    it('should preserve other groups in correct order', function() {
      createAdHocSubProcessGroupsStub.returns([
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] }
      ]);
      const groups = [
        { id: 'group1', entries: [] },
        { id: 'subprocess', entries: [] },
        { id: 'group2', entries: [] },
        { id: 'group3', entries: [] }
      ];
      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      const ids = result.map(g => g.id);
      expect(ids).to.deep.equal([
        'group1',
        'subprocess',
        'ad_hoc_subprocess_active_tasks',
        'ad_hoc_subprocess_completion',
        'group2',
        'group3'
      ]);
    });

    it('should replace legacy adHocCompletion group with new groups', function() {
      createAdHocSubProcessGroupsStub.returns([
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] }
      ]);
      const groups = [
        { id: 'foo', entries: [] },
        { id: 'adHocCompletion', entries: [] },
        { id: 'subprocess', entries: [] },
        { id: 'bar', entries: [] }
      ];

      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      const ids = result.map(g => g.id);

      expect(ids).to.not.include('adHocCompletion');
      expect(ids).to.deep.equal([
        'foo',
        'subprocess',
        'ad_hoc_subprocess_active_tasks',
        'ad_hoc_subprocess_completion',
        'bar'
      ]);
    });

    it('should remove legacy adHocCompletion group without duplicating existing new groups', function() {
      const groups = [
        { id: 'foo', entries: [] },
        { id: 'adHocCompletion', entries: [] },
        { id: 'ad_hoc_subprocess_active_tasks', entries: [] },
        { id: 'ad_hoc_subprocess_completion', entries: [] },
        { id: 'bar', entries: [] }
      ];

      const getGroups = provider.getGroups({});
      const result = getGroups(groups);
      const ids = result.map(g => g.id);

      expect(ids).to.not.include('adHocCompletion');
      expect(ids.filter(id => id === 'ad_hoc_subprocess_active_tasks')).to.have.length(1);
      expect(ids.filter(id => id === 'ad_hoc_subprocess_completion')).to.have.length(1);
      expect(createAdHocSubProcessGroupsStub.called).to.be.false;
    });
  });
});
