import ModalContentsBase from './components/ModalContentsBase';
import ModalOpenButton from './components/ModalOpenButton';
import ModalProvider from './components/ModalProvider';

const Modal = Object.assign(ModalProvider, {
  OpenButton: ModalOpenButton,
  ContentsBase: ModalContentsBase,
});

export default Modal;
