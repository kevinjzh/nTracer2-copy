import styled from "styled-components"
import { useContext } from "react"
import { SocketContext } from "./Context"
import { BASE_URL } from "./App"

export function ExportMenu() {
    const socket = useContext(SocketContext)

    const saveFile = (blob, filename) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const onExportSelected = async () => {
        const res = await fetch(`${BASE_URL}/swc/export?selected=true`)
        const data = await res.blob()
        saveFile(data, "swc_selected.zip")
    }

    const onExportAll = async () => {
        const res = await fetch(`${BASE_URL}/swc/export?selected=false`)
        const data = await res.blob()
        saveFile(data, "swc_all.zip")
    }

    const onImport = async (e) => {
        e.preventDefault()
        const files = document.forms['import-form']['input-swc'].files
        if (files.length == 0) return

        console.log(files)

        for (const file of Object.values(files)) {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            console.log("import0")
            reader.onload = async (e) => {
                const data = new Blob([e.target.result])
                const res = await fetch(`${BASE_URL}/swc/import`, {
                    method: "POST",
                    body: data
                })
                if (res.status === 200) {
                    document.forms['import-form']['input-swc'].value = ""
                }
            }
        }
    }

    return (
        <Container>
            <Group>
                <GroupHeading>Export</GroupHeading>
                <Row>
                    <Button onClick={onExportSelected}>Export selected</Button>
                    <Button onClick={onExportAll}>Export all</Button>
                </Row>
            </Group>
            <Group>
                <GroupHeading>Import</GroupHeading>
                <form name="import-form">
                    <FileInput type="file" name="input-swc" placeholder="filename" id="input-swc" multiple accept=".swc" />
                    <SubmitInput type="submit" value="Submit" onClick={onImport}/>
                </form>
            </Group>
        </Container>
    )
}

const Container = styled.div`
margin-left: 1rem;
`

const Button = styled.button`
margin-right: 0.5rem;
border: none;
background-color: #f0f0f0;
padding: 1rem;
border-radius: 0.5rem;
font-size: 0.9rem;
cursor: pointer;
`

const FileInput = styled.input`
`

const SubmitInput = styled.input`
margin-top: 1rem;
padding: 0.5rem 1rem;
border: none;
border-radius: 0.5rem;
font-size: 0.9rem;
cursor: pointer;

`

const Group = styled.div`
:not(:last-child) {
    margin-bottom: 3rem;
}
`

const GroupHeading = styled.h3`
font-size: 1.5rem;
margin: 0;
padding: 0;
margin-top: 1.5rem;
margin-bottom: 1rem;
`

const Row = styled.div`
display: flex;
`