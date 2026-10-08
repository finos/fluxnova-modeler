import JobExecutionExtensionProvider from './JobExecutionExtensionProvider';
import AdHocSubProcessExtensionProvider from './AdHocSubProcessExtensionProvider';

export default {
  __init__: [
    'bpmnJobExecutionExtensionProvider',
    'adHocSubProcessExtensionProvider'
  ],
  bpmnJobExecutionExtensionProvider: [ 'type', JobExecutionExtensionProvider ],
  adHocSubProcessExtensionProvider: [ 'type', AdHocSubProcessExtensionProvider ]
};
