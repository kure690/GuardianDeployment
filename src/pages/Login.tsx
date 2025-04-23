import {Container, TextField, Button} from "@mui/material";
import Grid from "@mui/material/Grid2";
import icon from "../assets/images/icon.png";
import {Typography} from "@mui/material";
import {useState} from "react";
import axios from "axios";
import config from "../config";
import {useNavigate} from "react-router-dom";
import {StreamChat} from 'stream-chat';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const loginData = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await axios.post(
        `${config.PERSONAL_API}/users/login`,
        loginData
      );

      const {token, user} = response.data;
      
      console.log('Login response:', response.data);
      
      localStorage.setItem("user", JSON.stringify({
        ...user,
        id: user.id, 
        role: response.data.role,
        name: `${response.data.firstName} ${response.data.lastName}`
      }));
      localStorage.setItem("token", token);
      

      localStorage.setItem("chatClient", JSON.stringify({
        id: user.id,
        token: token,
      }));

      const userRole = response.data.role.toLowerCase();  
      console.log('User role:', userRole);
      
      if (userRole === 'lgu') {
        window.location.href = '/lgu-main';
      } else {
        window.location.href = '/status';
      }

    } catch (err: any) {
      console.error("Login error:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to login. Please check your credentials."
      );
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <Container
        disableGutters
        sx={{
          maxWidth: "650px !important",
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
        <Grid container>
          <Grid size={{xs: 12}} sx={{padding: "40px"}}>
            <div className="flex items-center gap-5">
              <img src={icon} className="w-18 h-18" />
              <div>
                <Typography
                  variant="h4"
                  sx={{fontWeight: "bolder", color: "#1B4965"}}>
                  GuardianPH V3
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Emergency Dispatch Operator
                </Typography>
              </div>
            </div>
          </Grid>
          <Grid
            size={{xs: 12}}
            sx={{
              flexGrow: 1,
              backgroundColor: "#1B4965",
              padding: "2rem",
            }}>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <TextField
                  fullWidth
                  label="Email"
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}
                <center>
                  <div className="text-white text-sm">
                    <span className="cursor-pointer hover:underline">
                      Forgot Password
                    </span>
                    &nbsp;
                    {" | "}&nbsp;
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate("/register")}>
                      Register
                    </span>
                  </div>
                </center>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  sx={{
                    mt: 2,
                    backgroundColor: "#0096FF",
                    "&:hover": {
                      backgroundColor: "#0078CC",
                    },
                  }}>
                  Log in
                </Button>
              </div>
            </form>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Login;
