import styled from 'styled-components/macro'

export default function Status({ statusMessage }) {
  if (!statusMessage) return <Container></Container>
  return (
    <Container>
      <Title>Info</Title>
      <Message>{ statusMessage }</Message>
    </Container>
  )
}

const Container = styled.div`
margin-left: 0.7rem;
height: 10%;
`

const Title = styled.p`
font-weight: bold;
font-size: 0.9em;
color: rgba(0,0,0,0.9);
margin: 0;
margin-top: 0.5rem;
margin-bottom: 0.2rem;
`

const Message = styled.p`
font-size: 0.8em;
color: rgba(0,0,0,0.8);
margin: 0;
`