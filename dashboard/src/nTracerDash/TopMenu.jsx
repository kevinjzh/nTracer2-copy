import styled from 'styled-components/macro'

export default function TopMenu() {
    return (
        <>
            <div style={{display: 'flex'}}>
                <TopButton>Connected</TopButton>
                <TopButton>Copy Tag</TopButton>
                <ButtonSideText>Set Type:</ButtonSideText>
                <TopButton>Neurite</TopButton>
                <TopButton>Axon</TopButton>
                <TopButton>(Basal) Dendrite</TopButton>
                <TopButton>Apical Dendrite</TopButton>
            </div>
            <br />
            <div style={{display: 'flex'}}>
                <TopButton>Select</TopButton>
                <span style={{marginLeft: 10,  marginTop: 5, fontSize: 12, marginRight: 10}}>(Neuron #</span>
                <MenuInput type="text"/>
                <ButtonSideText>) + (</ButtonSideText>
                <TopButton style={{marginRight: 10}}>Tag</TopButton>
                <MenuInput type="text"/>
                <ButtonSideText>)</ButtonSideText>
                <select name="tag" id="tagDropDown">
                <option value="plus">+</option>
                <option value="minus">-</option>
                </select>
                <select name="neuron" id="neuronType"  style={{marginLeft: 10}}>
                <option value="wholeNueron">Whole Neuron</option>
                <option value="neurite">Neurite</option>
                <option value="axon">Axon</option>
                <option value="allDendrite">All Dendrite</option>
                <option value="basal">(Basal) Dendrite</option>
                <option value="apical">Apical Dendrite</option>
                </select>
            </div>
      </>
    )
}


const TopButton = styled.button`
background-color: inherit;
border: solid;
border-width: thin;
outline: none;
cursor: pointer;
padding: 5px 10px;
transition: 0.3s;
border-radius: 4px;
margin-left: 10px;
font-size: 10px;
`

const ButtonSideText = styled.span`
margin-left: 10px;
margin-top: 5px;
font-size: 12px;
margin-right: 10px;
`

const MenuInput = styled.input`
width: 50px;
`