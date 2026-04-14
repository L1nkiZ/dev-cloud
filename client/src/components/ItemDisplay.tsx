import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash'
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen'
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

export function ItemDisplay({ item, onItemUpdate, onItemRemoval }: ItemDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(item.name)

  const toggleCompletion = () => {
    fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: item.name,
        completed: !item.completed,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then(onItemUpdate)
  }

  const toggleEditing = () => {
    setEditedName(item.name)
    setIsEditing((current) => !current)
  }

  const saveEdition = () => {
    const trimmedName = editedName.trim()
    if (!trimmedName) {
      setEditedName(item.name)
      setIsEditing(false)
      return
    }

    fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: trimmedName,
        completed: item.completed,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((updatedItem) => {
        onItemUpdate(updatedItem)
        setIsEditing(false)
      })
  }

  const removeItem = () => {
    fetch(`/api/items/${item.id}`, { method: 'DELETE' }).then(() => onItemRemoval(item))
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
          {isEditing ? (
            <Form.Control
              size="sm"
              aria-label="Edit item name"
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  saveEdition()
                }
              }}
            />
          ) : (
            item.name
          )}
        </Col>
        <Col xs={2} className="text-center actions">
          {isEditing ? (
            <Button size="sm" variant="link" onClick={saveEdition} aria-label="Save item">
              Save
            </Button>
          ) : (
            <Button size="sm" variant="link" onClick={toggleEditing} aria-label="Edit item">
              <FontAwesomeIcon icon={faPen} />
            </Button>
          )}
          <Button size="sm" variant="link" onClick={removeItem} aria-label="Remove Item">
            <FontAwesomeIcon icon={faTrash} className="text-danger" />
          </Button>
        </Col>
      </Row>
    </Container>
  )
}
