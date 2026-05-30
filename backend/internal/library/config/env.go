package config

type Environment string

const (
	EnvLocal Environment = "local"
)

func (e Environment) String() string {
	return string(e)
}

func (e Environment) IsLocal() bool {
	return e == EnvLocal
}
