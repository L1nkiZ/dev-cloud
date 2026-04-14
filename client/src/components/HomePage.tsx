import { useNavigate } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import { TodoListCard } from './TodoListCard';
import { Greeting } from './Greeting';
import { useAuth } from '../services/authContext';

export default function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <Container>
            <Row>
                <Col md={{ offset: 3, span: 6 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            marginTop: '20px',
                        }}
                    >
                        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                            Déconnexion
                        </Button>
                    </div>
                    <Greeting />
                    <TodoListCard />
                </Col>
            </Row>
        </Container>
    );
}
