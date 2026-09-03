/* global sinon */

import {
  DmnEditor
} from '../DmnEditor';

import diagramXML from './diagram.dmn';

import renderEditorHelper from '../../../__tests__/helpers/renderEditor';


const defaultActiveSheet = { id: 'dmn' };


describe('<DmnEditor>', function() {

  describe('sheet change guards', function() {

    it('should not open if active sheet element is missing', async function() {

      // given
      const { instance, rerender } = await renderEditor(diagramXML);
      const openSpy = sinon.spy(instance, 'open');

      // when
      rerender(diagramXML, {
        activeSheet: {
          id: 'DecisionTable'
        }
      });

      // then
      expect(openSpy).to.not.have.been.called;
    });

  });


  describe('properties panel guards', function() {

    it('should not attach properties panel if panel ref is missing', async function() {

      // given
      const { instance } = await renderEditor(diagramXML);

      const modeler = instance.getModeler();
      const propertiesPanel = modeler.getActiveViewer().get('propertiesPanel');
      const propertiesAttachSpy = sinon.spy(propertiesPanel, 'attachTo');

      instance.propertiesPanelRef.current = null;

      // when
      instance.attachPropertiesPanel();

      // then
      expect(propertiesAttachSpy).to.not.have.been.called;
    });


    it('should attach properties panel after import has finished', async function() {

      // given
      const { instance } = await renderEditor(diagramXML);
      const attachPropertiesPanelSpy = sinon.spy(instance, 'attachPropertiesPanel');

      // when
      await instance.componentDidUpdate({
        activeSheet: defaultActiveSheet,
        xml: diagramXML
      }, {
        importing: true
      });

      // then
      expect(attachPropertiesPanelSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

function renderEditor(xml, options = {}) {
  return renderEditorHelper(DmnEditor, xml, {
    activeSheet: defaultActiveSheet,
    onSheetsChanged: () => {},
    ...options
  });
}
