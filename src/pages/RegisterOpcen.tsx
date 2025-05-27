import {Container, TextField, Button} from "@mui/material";
import Grid from "@mui/material/Grid2";
import icon from "../assets/images/icon.png";
import {Typography} from "@mui/material";
import {useState} from "react";
import axios from "axios";
import config from "../config";
import {useNavigate} from "react-router-dom";

type FormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address: string;
  description: string;
  dateEstablished: Date;
  telNo: string;
  alternateNo: string;
  mobileNumber: string;
  website: string;
  shortHistory: string;
  assignment: string;
};

const RegisterOpcen = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    address: "",
    description: "",
    dateEstablished: new Date(),
    telNo: "",
    alternateNo: "",
    mobileNumber: "",
    website: "",
    shortHistory: "",
    assignment: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${config.PERSONAL_API}/opcens/`,
        formData
      );

      setSuccess("Registration successful! Token: " + response.data.token);
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        address: "",
        description: "",
        dateEstablished: new Date(),
        telNo: "",
        alternateNo: "",
        mobileNumber: "",
        website: "",
        shortHistory: "",
        assignment: "",
      });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
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
                  Register your Account
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
                  label="First Name"
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
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
                <TextField
                  fullWidth
                  label="Address"
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
                <center>
                  <div className="text-white text-sm">
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate("/")}>
                      Already have an account? Login here
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
                  Register Account
                </Button>
              </div>
            </form>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default RegisterOpcen;
