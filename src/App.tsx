import { XtPDFViewer, ViewerToolbar } from './xt-pdf'
import './xt-pdf/style.css'

function App() {
  return (
    <XtPDFViewer
      url="/1708.08021-论文1.pdf"
      // url="https://yisa.ai/upload/file/2025/12/31/88311a4ddfef49c0a7bb9994d1895537.pdf"
      toolbar={<ViewerToolbar />}
    />
  )
}
export default App
