import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash'
import faCheckSquare from '@fortawesome/fontawesome-free-regular/faCheckSquare'
import faSquare from '@fortawesome/fontawesome-free-regular/faSquare'
import './ItemDisplay.scss'

interface TodoItem {
  id: string
  name: string
  completed: boolean
}

interface ItemDisplayProps {
  item: TodoItem
  onItemUpdate: (item: TodoItem) => void
  onItemRemoval: (item: TodoItem) => void
}

const API_URL = process.env.VITE_API_URL || '/api'

export function ItemDisplay({ item, onItemUpdate, onItemRemoval }: ItemDisplayProps) {
  const toggleCompletion = () => {
    fetch(`${API_URL}/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: item.name,
        completed: !item.completed,
      }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((r) => r.json())
      .then(onItemUpdate)
  }

  const removeItem = () => {
    fetch(`${API_URL}/items/${item.id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(() => onItemRemoval(item))
  }

  return (
    <Container fluid className={`item ${item.completed && 'completed'}`}>
      <Row>
        <Col xs={2} className="text-center">
          <Button
            className="toggles"
            size="sm"
            variant="link"
            onClick={toggleCompletion}
            aria-label={item.completed ? 'Mark item as incomplete' : 'Mark item as complete'}
          >
            <FontAwesomeIcon icon={(item.completed ? faCheckSquare : faSquare) as IconProp} />
            <i className={`far ${item.completed ? 'fa-check-square' : 'fa-square'}`} />
          </Button>
        </Col>
        <Col xs={8} className="name">
          {item.name}
        </Col>
        <Col xs={2} className="text-center remove">
          <Button size="sm" variant="link" onClick={removeItem} aria-label="Remove Item">
            <FontAwesomeIcon icon={faTrash} className="text-danger" />
          </Button>
        </Col>
      </Row>
    </Container>
  )
}
